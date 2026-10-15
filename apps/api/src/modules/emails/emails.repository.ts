import { emailError } from "./email-errors";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma, EmailRecipientStatus } from "@prisma/client";
import {
  LOCALE,
  type EmailBrandDetails,
  type EmailMessageSummary,
  type EmailMessageDetail,
  type EmailHistoryResponse,
} from "@clinic/types";
import { PrismaService } from "@/prisma/prisma.service";
import {
  EmailHistoryDto,
  EmailPaginationDto,
  EmailSettingsDto,
} from "./dto/email.dto";

type MessageWithCounts = Prisma.EmailMessageGetPayload<{
  include: {
    recipients: { select: { subject: true } };
    _count: {
      select: { recipients: true };
    };
  };
}>;

@Injectable()
export class EmailsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async brand(clinicId: string): Promise<EmailBrandDetails> {
    const clinic = await this.prisma.clinic.findFirst({
      where: {
        id: clinicId,
        isActive: true,
      },
      select: {
        name: true,
        nameAr: true,
        logoUrl: true,
        brandColor: true,
        timezone: true,
        phone: true,
        address: true,
        email: true,
        emailSettings: true,
      },
    });

    if (!clinic) {
      throw new NotFoundException(emailError("emailClinicNotFound"));
    }

    const { emailSettings, ...brandInfo } = clinic;

    return {
      ...brandInfo,
      ...emailSettings,
      email: emailSettings?.replyTo?.trim() || brandInfo.email,
      replyTo: emailSettings?.replyTo?.trim() || brandInfo.email || undefined,
      websiteUrl: emailSettings?.websiteUrl ?? undefined,
      instagramUrl: emailSettings?.instagramUrl ?? undefined,
      facebookUrl: emailSettings?.facebookUrl ?? undefined,
      linkedinUrl: emailSettings?.linkedinUrl ?? undefined,
      footerEn: emailSettings?.footerEn ?? undefined,
      footerAr: emailSettings?.footerAr ?? undefined,
    };
  }

  findRequest(clinicId: string, requestId: string) {
    return this.prisma.emailMessage.findUnique({
      where: {
        clinicId_requestId: {
          clinicId,
          requestId,
        },
      },
    });
  }

  create(data: Prisma.EmailMessageCreateInput) {
    return this.prisma.emailMessage.create({ data });
  }

  async list(
    clinicId: string,
    query: EmailHistoryDto,
  ): Promise<EmailHistoryResponse> {
    if (query.from && query.to && new Date(query.from) > new Date(query.to)) {
      throw new BadRequestException(emailError("emailDateRangeInvalid"));
    }

    const where: Prisma.EmailMessageWhereInput = {
      clinicId,
      ...(query.search && {
        subject: { contains: query.search, mode: "insensitive" as const },
      }),
      ...(query.status && { recipients: { some: { status: query.status } } }),
      ...(query.isTest !== undefined && { isTest: query.isTest }),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from && { gte: new Date(query.from) }),
              ...(query.to && { lte: new Date(query.to) }),
            },
          }
        : {}),
    };

    const rows = await this.prisma.emailMessage.findMany({
      where,
      include: {
        recipients: {
          take: 1,
          orderBy: { id: "asc" },
          select: { subject: true },
        },
        _count: {
          select: { recipients: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    const total = await this.prisma.emailMessage.count({ where });

    return {
      items: await this.present(rows),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async detail(
    clinicId: string,
    id: string,
    query: EmailPaginationDto,
  ): Promise<EmailMessageDetail> {
    const row = await this.prisma.emailMessage.findFirst({
      where: { id, clinicId },
      include: {
        recipients: {
          take: 1,
          orderBy: { id: "asc" },
          select: { subject: true },
        },
        _count: {
          select: { recipients: true },
        },
      },
    });

    if (!row) {
      throw new NotFoundException(emailError("emailMessageNotFound"));
    }

    const recipients = await this.prisma.emailRecipient.findMany({
      where: { messageId: id },
      orderBy: { id: "asc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        providerId: true,
        attempts: true,
        lastError: true,
        updatedAt: true,
      },
    });

    const [summary] = await this.present([row]);
    const rendered = await this.prisma.emailRecipient.findFirst({
      where: { messageId: id },
      orderBy: { id: "asc" },
      select: { subject: true, html: true, text: true },
    });

    return {
      ...summary,
      body: row.body,
      rendered: rendered ?? undefined,
      recipients: recipients.map((r) => ({
        ...r,
        updatedAt: r.updatedAt.toISOString(),
      })),
      totalRecipients: row._count.recipients,
      page: query.page,
      limit: query.limit,
    };
  }

  private async present(
    rows: MessageWithCounts[],
  ): Promise<EmailMessageSummary[]> {
    const ids = rows.map((row) => row.id);
    const counts = await this.counts(ids);
    const senders = await this.prisma.clinicUser.findMany({
      where: { id: { in: rows.map((row) => row.createdById) } },
      select: { id: true, name: true, nameAr: true },
    });
    const audienceRows = ids.length
      ? await this.prisma.emailRecipient.groupBy({
          by: ["messageId", "audience"],
          where: { messageId: { in: ids } },
        })
      : [];
    const senderById = new Map(senders.map((sender) => [sender.id, sender]));
    const audiences = new Map<string, EmailMessageSummary["audiences"]>();
    audienceRows.forEach((entry) => {
      const list = audiences.get(entry.messageId) ?? [];
      if (
        entry.audience === "patients" ||
        entry.audience === "practitioners" ||
        entry.audience === "staff" ||
        entry.audience === "financial" ||
        entry.audience === "owners" ||
        entry.audience === "admins" ||
        entry.audience === "external"
      ) {
        list.push(entry.audience);
      }
      audiences.set(entry.messageId, list);
    });
    return rows.map((row) => {
      const sender = senderById.get(row.createdById);
      return {
        id: row.id,
        subject: row.recipients[0]?.subject ?? row.subject,
        locale: row.locale === LOCALE.AR ? LOCALE.AR : LOCALE.EN,
        isTest: row.isTest,
        createdAt: row.createdAt.toISOString(),
        senderName: sender?.name ?? "",
        senderNameAr: sender?.nameAr ?? null,
        audiences: audiences.get(row.id) ?? [],
        recipientCount: row._count.recipients,
        counts: counts.get(row.id) ?? {},
      };
    });
  }

  private async counts(
    ids: string[],
  ): Promise<Map<string, Partial<Record<EmailRecipientStatus, number>>>> {
    const rows = await this.prisma.emailRecipient.groupBy({
      by: ["messageId", "status"],
      where: {
        messageId: { in: ids },
      },
      _count: { _all: true },
    });

    const result = new Map<
      string,
      Partial<Record<EmailRecipientStatus, number>>
    >();

    rows.forEach((row) => {
      const counts = result.get(row.messageId) ?? {};
      counts[row.status] = row._count._all;
      result.set(row.messageId, counts);
    });

    return result;
  }

  settings(clinicId: string) {
    return this.prisma.emailSettings.findUnique({
      where: { clinicId },
    });
  }

  replaceSettings(clinicId: string, dto: EmailSettingsDto) {
    const data = {
      replyTo: dto.replyTo ?? null,
      websiteUrl: dto.websiteUrl ?? null,
      instagramUrl: dto.instagramUrl ?? null,
      facebookUrl: dto.facebookUrl ?? null,
      linkedinUrl: dto.linkedinUrl ?? null,
      footerEn: dto.footerEn ?? null,
      footerAr: dto.footerAr ?? null,
    };

    return this.prisma.emailSettings.upsert({
      where: { clinicId },
      create: { clinicId, ...data },
      update: data,
    });
  }
}
