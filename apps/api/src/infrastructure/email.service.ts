import { Injectable, OnModuleInit } from "@nestjs/common";
import { Resend } from "resend";
import { createLogger } from "./logger";

export function inlineEmbeddedImages(html: string) {
  const attachments: {
    filename: string;
    content: string;
    contentType: string;
    contentId: string;
  }[] = [];
  const next = html.replace(
    /src="data:image\/(png|jpeg|jpg|webp);base64,([a-z0-9+/=\s]+)"/gi,
    (_match, subtype: string, payload: string) => {
      const kind =
        subtype.toLowerCase() === "jpg" ? "jpeg" : subtype.toLowerCase();
      const id = `logo-${attachments.length + 1}`;
      attachments.push({
        filename: `${id}.${kind === "jpeg" ? "jpg" : kind}`,
        content: payload.replace(/\s/g, ""),
        contentType: `image/${kind}`,
        contentId: id,
      });
      return `src="cid:${id}"`;
    },
  );
  return { html: next, attachments };
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  text?: string;
  replyTo?: string;
  idempotencyKey?: string;
  tags?: {
    name: string;
    value: string;
  }[];
}

export class EmailDeliveryError extends Error {
  constructor(
    readonly providerCode: string,
    readonly statusCode: number | null,
    readonly permanent: boolean,
    readonly retryAfterSeconds?: number,
  ) {
    super(
      `emailDeliveryFailed:resend:${providerCode}:${statusCode ?? "network"}`,
    );
  }
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

  get senderAddress() {
    return this.fromAddress;
  }

  get isEnabled() {
    return !!this.client;
  }

  async send(input: SendEmailInput) {
    if (!this.client) {
      this.log.warn("delivery_skipped");
      return { id: null, skipped: true as const };
    }

    const prepared = inlineEmbeddedImages(input.html);
    const { data, error, headers } = await this.client.emails.send(
      {
        from: input.from ?? this.fromAddress,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: prepared.html,
        ...(prepared.attachments.length
          ? { attachments: prepared.attachments }
          : {}),
        ...(input.tags ? { tags: input.tags } : {}),
        ...(input.text !== undefined ? { text: input.text } : {}),
        ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      },
      input.idempotencyKey
        ? { idempotencyKey: input.idempotencyKey }
        : undefined,
    );

    if (error || !data?.id) {
      this.log.error("send_failed");
      const status = error?.statusCode ?? null;
      const code =
        error?.name && /^[a-z_]{1,80}$/.test(error.name)
          ? error.name
          : "provider_error";
      const retryAfter = headers?.["retry-after"];
      const seconds = retryAfter ? Number(retryAfter) : NaN;
      const retryAt = retryAfter ? Date.parse(retryAfter) : NaN;
      const retryAfterSeconds = Number.isFinite(seconds)
        ? Math.max(0, seconds)
        : Number.isFinite(retryAt)
          ? Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))
          : undefined;
      throw new EmailDeliveryError(
        code,
        status,
        ["invalid_idempotent_request", "invalid_idempotency_key"].includes(
          code,
        ) ||
          (status !== null &&
            status >= 400 &&
            status < 500 &&
            ![408, 409, 425, 429].includes(status)),
        status === 429 ? (retryAfterSeconds ?? 60) : retryAfterSeconds,
      );
    }

    this.log.info("accepted", { id: data.id });

    return {
      id: data.id,
      skipped: false as const,
    };
  }
}
