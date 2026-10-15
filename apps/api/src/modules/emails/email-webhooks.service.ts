import { emailError } from "./email-errors";
import { BadRequestException, Injectable } from "@nestjs/common";
import { EmailRecipientStatus } from "@prisma/client";
import type { Resend } from "resend";
import { PrismaService } from "@/prisma/prisma.service";

export const DELIVERY_EVENTS: Partial<Record<string, EmailRecipientStatus>> = {
  "email.sent": "accepted",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
  "email.suppressed": "suppressed",
};

const DELIVERY_PRIORITY: Record<EmailRecipientStatus, number> = {
  queued: 0,
  processing: 0,
  accepted: 1,
  delayed: 2,
  failed: 3,
  delivered: 4,
  bounced: 5,
  suppressed: 6,
  complained: 7,
};

export const shouldApplyDelivery = (
  current: EmailRecipientStatus,
  next: EmailRecipientStatus,
  lastEventAt: Date | null,
  at: Date,
): boolean => {
  return (
    (!lastEventAt || at >= lastEventAt) &&
    DELIVERY_PRIORITY[next] >= DELIVERY_PRIORITY[current]
  );
};

@Injectable()
export class EmailWebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(id: string, event: ReturnType<Resend["webhooks"]["verify"]>) {
    const status = DELIVERY_EVENTS[event.type];

    if (!status || !("email_id" in event.data)) return;

    const recipientId =
      "tags" in event.data ? event.data.tags?.cureva_recipient : undefined;

    if (!recipientId) return;

    const at = new Date(event.created_at);

    if (!Number.isFinite(at.getTime())) {
      throw new BadRequestException(emailError("emailWebhookTimestampInvalid"));
    }

    const providerId = event.data.email_id;

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
          SELECT "id" FROM "EmailRecipient" WHERE "id" = ${recipientId} FOR UPDATE
        `;
      const recipient = await tx.emailRecipient.findUnique({
        where: { id: recipientId },
        include: {
          message: {
            select: { clinicId: true },
          },
        },
      });

      if (
        !recipient ||
        (recipient.providerId && recipient.providerId !== providerId)
      ) {
        return;
      }

      const receipt = await tx.emailWebhookReceipt.createMany({
        data: {
          id,
          providerId,
          type: event.type,
        },
        skipDuplicates: true,
      });
      if (!receipt.count) return;

      if (
        shouldApplyDelivery(recipient.status, status, recipient.lastEventAt, at)
      ) {
        await tx.emailRecipient.update({
          where: { id: recipient.id },
          data: {
            providerId,
            status,
            lastEventAt: at,
            leaseToken: null,
            leaseUntil: null,
            lastError: [
              "bounced",
              "complained",
              "failed",
              "suppressed",
            ].includes(status)
              ? `email_${status}`
              : null,
          },
        });
      }

      if (
        status === "bounced" ||
        status === "complained" ||
        status === "suppressed"
      ) {
        const clinicId = recipient.message.clinicId;

        await tx.emailSuppression.upsert({
          where: {
            clinicId_email: {
              clinicId,
              email: recipient.email,
            },
          },
          create: {
            clinicId,
            email: recipient.email,
            reason: status,
          },
          update: {
            reason: status,
          },
        });
      }
    });
  }
}
