import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import type { EmailRecipient } from "@prisma/client";
import { EmailDeliveryError } from "@/infrastructure/email.service";
import { randomUUID } from "node:crypto";
import { PrismaService } from "@/prisma/prisma.service";
import { EmailService } from "@/infrastructure/email.service";
import { createLogger } from "@/infrastructure/logger";
import { RateLimitService } from "@/security/services/rate-limit.service";

@Injectable()
export class EmailDispatchWorker implements OnModuleInit, OnModuleDestroy {
  private readonly log = createLogger(EmailDispatchWorker.name);
  private timer?: ReturnType<typeof setInterval>;
  private active = false;
  private stopped = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly limits: RateLimitService,
  ) { }

  onModuleInit() {
    if (process.env.EMAIL_WORKER_ENABLED === "false") return;

    this.timer = setInterval(() => {
      void this.tick();
    }, 1000);

    this.timer.unref();
  }

  onModuleDestroy() {
    this.stopped = true;

    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async tick() {
    if (this.active || this.stopped || !this.email.isEnabled) {
      return;
    }

    this.active = true;

    try {
      const cooldown = await this.prisma.authRateLimit.findUnique({
        where: { id: "email-provider-cooldown" },
      });
      if (cooldown && cooldown.expiresAt > new Date()) return;

      await this.limits.consume("email-dispatch", "global", 1, 1);

      await this.dispatch();
    } catch {
      this.log.warn("dispatch_deferred");
    } finally {
      this.active = false;
    }
  }

  private async dispatch() {
    const now = new Date();
    const leaseUntil = new Date(Date.now() + 2 * 60 * 1000);
    const token = randomUUID();

    const [recipient] = await this.prisma.$queryRaw<EmailRecipient[]>`
      WITH candidate AS (
        SELECT "id" FROM "EmailRecipient"
        WHERE ("status" = 'queued' AND "nextAttemptAt" <= ${now})
           OR ("status" = 'processing' AND ("leaseUntil" <= ${now} OR "leaseUntil" IS NULL))
        ORDER BY "nextAttemptAt", "id"
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE "EmailRecipient" AS recipient
      SET "status" = 'processing', "leaseToken" = ${token},
          "leaseUntil" = ${leaseUntil}, "attempts" = recipient."attempts" + 1,
          "firstAttemptAt" = COALESCE(recipient."firstAttemptAt", ${now}),
          "updatedAt" = ${now}
      FROM candidate
      WHERE recipient."id" = candidate."id"
      RETURNING recipient.*
    `;

    if (!recipient) return;

    const firstAttemptAt = recipient.firstAttemptAt
      ? new Date(recipient.firstAttemptAt)
      : null;

    const ownedLease = () => ({
      id: recipient.id,
      leaseToken: token,
      leaseUntil: { gt: new Date() },
      status: "processing" as const,
    });

    if (
      firstAttemptAt &&
      Date.now() - firstAttemptAt.getTime() > 23 * 3600_000
    ) {
      await this.prisma.emailRecipient.updateMany({
        where: ownedLease(),
        data: {
          status: "failed",
          lastError: "emailRetryWindowExpired",
          leaseToken: null,
          leaseUntil: null,
        },
      });

      return;
    }

    const message = await this.prisma.emailMessage.findUniqueOrThrow({
      where: { id: recipient.messageId },
      select: { clinicId: true },
    });

    const suppressed = await this.prisma.emailSuppression.findUnique({
      where: {
        clinicId_email: {
          clinicId: message.clinicId,
          email: recipient.email,
        },
      },
    });

    if (suppressed) {
      await this.prisma.emailRecipient.updateMany({
        where: ownedLease(),
        data: {
          status: "suppressed",
          leaseToken: null,
          leaseUntil: null,
          lastError: "emailRecipientSuppressed",
        },
      });

      return;
    }

    try {
      const result = await this.email.send({
        to: recipient.email,
        from: recipient.fromAddress,
        subject: recipient.subject,
        html: recipient.html,
        text: recipient.text,
        replyTo: recipient.replyTo ?? undefined,
        tags: [
          {
            name: "cureva_recipient",
            value: recipient.id,
          },
        ],
        idempotencyKey: `cureva-email/${recipient.id}`,
      });

      if (result.skipped || !result.id) {
        throw new Error("emailUnavailable");
      }

      await this.prisma.emailRecipient.updateMany({
        where: ownedLease(),
        data: {
          status: "accepted",
          providerId: result.id,
          leaseToken: null,
          leaseUntil: null,
          lastError: null,
        },
      });
    } catch (error) {
      const failure = error instanceof EmailDeliveryError ? error : undefined;
      const rateLimited =
        failure?.statusCode === 429 ||
        failure?.providerCode === "rate_limit_exceeded";
      if (rateLimited) {
        const expiresAt = new Date(
          Date.now() + (failure?.retryAfterSeconds ?? 60) * 1000,
        );
        await this.prisma.$executeRaw`
          INSERT INTO "AuthRateLimit" ("id", "count", "expiresAt")
          VALUES ('email-provider-cooldown', 1, ${expiresAt})
          ON CONFLICT ("id") DO UPDATE SET
            "expiresAt" = GREATEST("AuthRateLimit"."expiresAt", ${expiresAt})
        `;
      }
      await this.prisma.emailRecipient.updateMany({
        where: ownedLease(),
        data: {
          status:
            failure?.permanent || (!rateLimited && recipient.attempts >= 5)
              ? "failed"
              : "queued",
          ...(rateLimited && { attempts: { decrement: 1 } }),
          lastError: failure?.message ?? "emailDeliveryFailed",
          nextAttemptAt: new Date(
            Date.now() +
            Math.max(
              failure?.retryAfterSeconds ?? 0,
              Math.min(3600, 30 * 2 ** recipient.attempts),
            ) *
            1000,
          ),
          leaseToken: null,
          leaseUntil: null,
        },
      });
    }
  }
}
