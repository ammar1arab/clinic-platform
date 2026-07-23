import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Resend } from "resend";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * FUTURE: Resend for custom + automated transactional emails
 * (reminders, receipts, referral updates, etc.).
 * No-ops when RESEND_API_KEY is unset.
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private client: Resend | null = null;
  private fromAddress = "Clinic Platform <onboarding@resend.dev>";

  onModuleInit() {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      this.logger.warn("Resend not configured — emails are no-ops");
      return;
    }
    this.client = new Resend(key);
    if (process.env.RESEND_FROM) {
      this.fromAddress = process.env.RESEND_FROM;
    }
  }

  get isEnabled() {
    return !!this.client;
  }

  async send(input: SendEmailInput) {
    if (!this.client) {
      this.logger.debug(
        `Email skipped (no Resend key): ${input.subject} → ${Array.isArray(input.to) ? input.to.join(", ") : input.to}`,
      );
      return { id: null, skipped: true as const };
    }

    const { data, error } = await this.client.emails.send({
      from: input.from ?? this.fromAddress,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      this.logger.error(`Resend error: ${error.message}`);
      throw new Error(error.message);
    }

    return { id: data?.id ?? null, skipped: false as const };
  }
}
