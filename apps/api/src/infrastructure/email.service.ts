import { Injectable, OnModuleInit } from "@nestjs/common";
import { Resend } from "resend";
import { createLogger } from "./logger";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly log = createLogger(EmailService.name);
  private client: Resend | null = null;
  private fromAddress = "Cureva Clinic <onboarding@resend.dev>";

  onModuleInit() {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      this.log.warn("not_configured");
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
      this.log.debug("skipped", {
        subject: input.subject,
        to: Array.isArray(input.to) ? input.to.join(",") : input.to,
      });
      return { id: null, skipped: true as const };
    }

    const { data, error } = await this.client.emails.send({
      from: input.from ?? this.fromAddress,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      this.log.error("send_failed", { message: error.message });
      throw new Error(error.message);
    }

    this.log.info("sent", {
      id: data?.id ?? undefined,
      subject: input.subject,
    });
    return { id: data?.id ?? null, skipped: false as const };
  }
}
