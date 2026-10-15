import { emailError } from "./email-errors";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { EmailService } from "@/infrastructure/email.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RateLimitService } from "@/security/services/rate-limit.service";
import type { AuthUser } from "@/modules/auth/types";
import {
  LOCALE,
  EMAIL_AUDIENCE,
  type EmailAudiencesResponse,
  type EmailRecipientPreview,
  type EmailRecipientsResponse,
  type EmailPreviewResponse,
} from "@clinic/types";
import { EmailAudienceRepository } from "./email-audience.repository";
import { EmailsRepository } from "./emails.repository";
import { renderEmail } from "./email-template";
import {
  EmailContentDto,
  EmailSelectionDto,
  PreviewEmailDto,
  SendEmailDto,
  TestEmailDto,
  EmailHistoryDto,
  EmailPaginationDto,
  EmailSettingsDto,
} from "./dto/email.dto";

type CanonicalInput =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly CanonicalInput[]
  | { readonly [key: string]: CanonicalInput }
  | object;

const canonical = (value: CanonicalInput): string => {
  if (value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return `[${value
      .map((item) => canonical(item))
      .sort()
      .join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v as CanonicalInput))
      .join(",")}}`;
  }

  return JSON.stringify(value);
};

export function emailSelectionHash(
  clinicId: string,
  recipients: EmailRecipientPreview[],
) {
  return createHash("sha256")
    .update(canonical({ clinicId, recipients }))
    .digest("hex");
}

@Injectable()
export class EmailsService {
  constructor(
    private readonly repo: EmailsRepository,
    private readonly audience: EmailAudienceRepository,
    private readonly email: EmailService,
    private readonly prisma: PrismaService,
    private readonly limits: RateLimitService,
  ) {}

  audiences(): EmailAudiencesResponse {
    return { audiences: ["all", ...Object.values(EMAIL_AUDIENCE)] };
  }

  async recipients(
    user: AuthUser,
    selection: EmailSelectionDto,
  ): Promise<EmailRecipientsResponse> {
    await this.limits.consume("email-preview", user.userId, 60, 60);

    const recipients = await this.audience.resolve(user.clinicId, selection);

    return {
      recipients,
      count: recipients.length,
      selectionHash: emailSelectionHash(user.clinicId, recipients),
    };
  }

  async preview(
    user: AuthUser,
    dto: PreviewEmailDto,
  ): Promise<EmailPreviewResponse> {
    await this.limits.consume("email-preview", user.userId, 60, 60);

    const brand = await this.repo.brand(user.clinicId);

    if (dto.recipient && dto.externalRecipient) {
      throw new BadRequestException(emailError("invalidEmailRequest"));
    }

    if (dto.recipient) {
      const [recipient] = await this.audience.resolve(user.clinicId, {
        filters: {
          audience: dto.recipient.audience,
          ids: [dto.recipient.id],
        },
      });

      if (!recipient) {
        throw new BadRequestException(emailError("emailRecipientNotFound"));
      }

      const name =
        dto.locale === LOCALE.AR
          ? recipient.nameAr || recipient.name
          : recipient.name;

      return renderEmail(dto, brand, name);
    }

    return renderEmail(
      dto,
      brand,
      dto.externalRecipient ? dto.externalRecipient.name || "" : "",
    );
  }

  async send(user: AuthUser, dto: SendEmailDto) {
    return this.enqueue(user, dto, false);
  }

  async test(user: AuthUser, dto: TestEmailDto) {
    return this.enqueue(user, dto, true);
  }

  private async enqueue(
    user: AuthUser,
    dto: EmailContentDto & {
      requestId: string;
      selectionHash?: string;
    } & EmailSelectionDto,
    isTest: boolean,
  ) {
    const hash = createHash("sha256")
      .update(
        canonical({
          dto,
          isTest,
          userId: user.userId,
        }),
      )
      .digest("hex");

    const existing = await this.repo.findRequest(user.clinicId, dto.requestId);

    if (existing) {
      return this.existing(user.clinicId, existing, hash);
    }

    if (!this.email.isEnabled) {
      throw new ServiceUnavailableException(emailError("emailUnavailable"));
    }

    await this.limits.consume(
      "email-send-user",
      user.userId,
      isTest ? 10 : 20,
      3600,
    );

    await this.limits.consume("email-send-clinic", user.clinicId, 50, 3600);

    const brand = await this.repo.brand(user.clinicId);
    let recipients: EmailRecipientPreview[];

    if (isTest) {
      const member = await this.prisma.clinicUser.findFirst({
        where: {
          id: user.clinicUserId,
          clinicId: user.clinicId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          user: {
            select: { email: true },
          },
        },
      });

      if (!member) {
        throw new BadRequestException(emailError("emailActiveUserNotFound"));
      }

      recipients = await this.audience.resolve(user.clinicId, {
        externalRecipients: [
          {
            email: member.user.email,
            name: member.name,
          },
        ],
      });
    } else {
      recipients = await this.audience.resolve(user.clinicId, dto);
    }

    if (
      !isTest &&
      dto.selectionHash !== emailSelectionHash(user.clinicId, recipients)
    ) {
      throw new ConflictException(emailError("emailSelectionChanged"));
    }

    if (!recipients.length) {
      throw new BadRequestException(emailError("emailNoRecipients"));
    }

    const renderedAt = new Date();

    const data = recipients.map((recipient) => {
      const name =
        dto.locale === LOCALE.AR
          ? recipient.nameAr || recipient.name
          : recipient.name;

      return {
        sourceId: recipient.sourceId,
        audience: recipient.audience,
        email: recipient.email,
        name,
        ...renderEmail(dto, brand, name, renderedAt),
        replyTo: brand.replyTo,
        fromAddress: this.email.senderAddress,
      };
    });

    try {
      const message = await this.repo.create({
        clinic: {
          connect: { id: user.clinicId },
        },
        createdById: user.clinicUserId,
        requestId: dto.requestId,
        requestHash: hash,
        locale: dto.locale,
        subject: dto.subject.trim(),
        body: dto.body.trim(),
        isTest,
        recipients: {
          create: data,
        },
      });

      return this.repo.detail(user.clinicId, message.id, {
        page: 1,
        limit: 20,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const concurrent = await this.repo.findRequest(
          user.clinicId,
          dto.requestId,
        );

        if (concurrent) {
          return this.existing(user.clinicId, concurrent, hash);
        }
      }

      throw error;
    }
  }

  async settings(user: AuthUser) {
    const row = await this.repo.settings(user.clinicId);
    return {
      replyTo: row?.replyTo ?? undefined,
      websiteUrl: row?.websiteUrl ?? undefined,
      instagramUrl: row?.instagramUrl ?? undefined,
      facebookUrl: row?.facebookUrl ?? undefined,
      linkedinUrl: row?.linkedinUrl ?? undefined,
      footerEn: row?.footerEn ?? undefined,
      footerAr: row?.footerAr ?? undefined,
    };
  }

  async replaceSettings(user: AuthUser, dto: EmailSettingsDto) {
    await this.repo.replaceSettings(user.clinicId, dto);
    return this.settings(user);
  }

  list(user: AuthUser, query: EmailHistoryDto) {
    return this.repo.list(user.clinicId, query);
  }

  detail(user: AuthUser, id: string, query: EmailPaginationDto) {
    return this.repo.detail(user.clinicId, id, query);
  }

  private existing(
    clinicId: string,
    message: {
      id: string;
      requestHash: string;
    },
    hash: string,
  ) {
    if (message.requestHash !== hash) {
      throw new ConflictException(emailError("emailRequestConflict"));
    }

    return this.repo.detail(clinicId, message.id, { page: 1, limit: 20 });
  }
}
