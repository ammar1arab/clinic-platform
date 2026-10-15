import {
  ValidationPipe,
  type ExecutionContext,
  type RawBodyRequest,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createHmac } from "node:crypto";
import type { Request } from "express";
import { RolesGuard } from "@/modules/auth/guards";
import { Role } from "@prisma/client";
import { EmailsController } from "./emails.controller";
import { EmailWebhookController } from "./email-webhook.controller";
import { EmailWebhooksService } from "./email-webhooks.service";
import {
  EmailSettingsDto,
  SendEmailDto,
  EmailHistoryDto,
} from "./dto/email.dto";

const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
});

const valid = {
  requestId: "5f54167c-4a8a-4613-9c05-fa329ce29f7d",
  selectionHash: "a".repeat(64),
  locale: "en",
  subject: "Hello",
  body: "Body",
  externalRecipients: [
    {
      email: "person@example.com",
    },
  ],
};

describe("Email HTTP contracts and access policy", () => {
  it("strips client tenant authority and sender spoofing", async () => {
    const dto = await pipe.transform(
      {
        ...valid,
        clinicId: "foreign",
        from: "spoof@example.com",
      },
      {
        type: "body",
        metatype: SendEmailDto,
      },
    );

    expect(dto.clinicId).toBeUndefined();
    expect(dto.from).toBeUndefined();
  });

  it.each([
    { locale: "fr" },
    { subject: "a\nb" },
    { requestId: "invalid" },
    { externalRecipients: [{ email: "invalid" }] },
    { filters: { audience: "patients", ids: [] } },
    {
      filters: {
        audience: "patients",
        appointmentStatuses: ["invalid_status"],
      },
    },
    {
      filters: {
        audience: "patients",
        isPaid: "false",
      },
    },
  ])("rejects invalid body %j", async (change) => {
    await expect(
      pipe.transform(
        {
          ...valid,
          ...change,
        },
        {
          type: "body",
          metatype: SendEmailDto,
        },
      ),
    ).rejects.toThrow();
  });

  it("validates and bounds pagination", async () => {
    const dto = await pipe.transform(
      {
        page: "2",
        limit: "25",
      },
      {
        type: "query",
        metatype: EmailHistoryDto,
      },
    );

    expect(dto.page).toBe(2);

    await expect(
      pipe.transform(
        { limit: "101" },
        {
          type: "query",
          metatype: EmailHistoryDto,
        },
      ),
    ).rejects.toThrow();
  });

  it("rejects unsafe branding links", async () => {
    await expect(
      pipe.transform(
        {
          websiteUrl: "javascript:alert(1)",
        },
        {
          type: "body",
          metatype: EmailSettingsDto,
        },
      ),
    ).rejects.toThrow();
  });

  const allowed = (
    role: Role,
    method: keyof EmailsController = "list",
  ) => {
    const context = {
      getClass: () => EmailsController,
      getHandler: () => EmailsController.prototype[method],
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role },
        }),
      }),
    } as unknown as ExecutionContext;

    return new RolesGuard(
      new Reflector(),
    ).canActivate(context);
  };

  it("enforces operations roles", () => {
    expect(allowed(Role.owner)).toBe(true);
    expect(allowed(Role.admin)).toBe(true);
    expect(() => allowed(Role.practitioner)).toThrow();
    expect(() => allowed(Role.financial)).toThrow();
  });

  it("reserves settings writes for the owner", () => {
    expect(
      allowed(Role.owner, "replaceSettings"),
    ).toBe(true);

    expect(() =>
      allowed(Role.admin, "replaceSettings"),
    ).toThrow();
  });
});

describe("Resend raw webhook signatures", () => {
  const apply = jest.fn();

  const controller = new EmailWebhookController(
    { apply } as Partial<EmailWebhooksService> as EmailWebhooksService,
  );

  const secret = Buffer.from(
    "synthetic-signing-secret",
  ).toString("base64");

  const previous = process.env.RESEND_WEBHOOK_SECRET;

  const payload = JSON.stringify({
    type: "email.delivered",
    created_at: new Date().toISOString(),
    data: {
      email_id: "synthetic",
      tags: {
        cureva_recipient: "synthetic",
      },
    },
  });

  const req = {
    rawBody: Buffer.from(payload),
  } as RawBodyRequest<Request>;

  beforeEach(() => {
    apply.mockReset();

    process.env.RESEND_WEBHOOK_SECRET =
      `whsec_${secret}`;
  });

  afterAll(() => {
    if (previous === undefined) {
      delete process.env.RESEND_WEBHOOK_SECRET;
    } else {
      process.env.RESEND_WEBHOOK_SECRET = previous;
    }
  });

  const signature = (timestamp: string) =>
    `v1,${createHmac(
      "sha256",
      Buffer.from(secret, "base64"),
    )
      .update(`event-id.${timestamp}.${payload}`)
      .digest("base64")}`;

  it("accepts valid raw bytes", async () => {
    const timestamp = String(
      Math.floor(Date.now() / 1000),
    );

    expect(
      await controller.receive(
        req,
        "event-id",
        timestamp,
        signature(timestamp),
      ),
    ).toEqual({ received: true });

    expect(apply).toHaveBeenCalledWith(
      "event-id",
      JSON.parse(payload),
    );
  });

  it("rejects tampering", async () => {
    await expect(
      controller.receive(
        req,
        "event-id",
        String(Math.floor(Date.now() / 1000)),
        "v1,invalid",
      ),
    ).rejects.toThrow();

    expect(apply).not.toHaveBeenCalled();
  });

  it("rejects stale signatures", async () => {
    const timestamp = String(
      Math.floor(Date.now() / 1000) - 3600,
    );

    await expect(
      controller.receive(
        req,
        "event-id",
        timestamp,
        signature(timestamp),
      ),
    ).rejects.toThrow();
  });

  it("fails closed without a secret", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;

    await expect(
      controller.receive(
        req,
        "event-id",
        "0",
        "invalid",
      ),
    ).rejects.toThrow();
  });
});
