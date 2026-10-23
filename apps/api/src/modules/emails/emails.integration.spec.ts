import { Test } from "@nestjs/testing";
import {
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
  type ExecutionContext,
} from "@nestjs/common";
import type { Server } from "node:http";
import { randomUUID, createHmac } from "node:crypto";
import request from "supertest";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type EmailRecipient,
} from "@prisma/client";
import { PrismaModule } from "@/prisma/prisma.module";
import { PrismaService } from "@/prisma/prisma.service";
import {
  EmailService,
  type SendEmailInput,
} from "@/infrastructure/email.service";
import { InfrastructureModule } from "@/infrastructure/infrastructure.module";
import { JwtAuthGuard } from "@/modules/auth/guards";
import type { AuthUser } from "@/modules/auth/types";
import { EmailsModule } from "./emails.module";
import { EmailDispatchWorker } from "./email-dispatch.worker";

const integration = process.env.EMAIL_INTEGRATION_URL
  ? describe
  : describe.skip;

integration("Clinic email HTTP and PostgreSQL invariants", () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let pool: Pool;
  let clinicId: string;
  let otherClinicId: string;
  let owner: AuthUser;
  let doctor: AuthUser;
  let patientId: string;
  let otherPatientId: string;
  let departmentId: string;
  let serviceId: string;
  let lastMessageId: string;
  let api: ReturnType<typeof request>;
  let worker: EmailDispatchWorker;

  let enabled = true;
  let fail = false;

  const sent: SendEmailInput[] = [];
  const run = randomUUID();
  const users = new Map<string, AuthUser>();

  const secret = Buffer.from(
    "synthetic-webhook-test-secret",
  ).toString("base64");

  const original = {
    worker: process.env.EMAIL_WORKER_ENABLED,
    webhook: process.env.RESEND_WEBHOOK_SECRET,
    jwt: process.env.JWT_SECRET,
  };

  const ownerEmail = `owner-${run}@example.com`;

  const content = () => ({
    requestId: randomUUID(),
    locale: "en",
    subject: "Hello {{recipientName}}",
    body: "From {{clinicName}}",
  });

  const send = (
    body: object,
    token = "owner",
  ) =>
    api
      .post("/emails/send")
      .set("Authorization", token)
      .send(body);

  beforeAll(async () => {
    process.env.EMAIL_WORKER_ENABLED = "false";

    process.env.RESEND_WEBHOOK_SECRET =
      `whsec_${secret}`;

    process.env.JWT_SECRET =
      "email-integration-synthetic-secret";

    pool = new Pool({
      connectionString: process.env.EMAIL_INTEGRATION_URL,
      max: 1,
      ssl: false,
    });

    prisma = new PrismaClient({
      adapter: new PrismaPg(pool),
    });

    await prisma.$connect();

    clinicId = (
      await prisma.clinic.create({
        data: {
          name: `Email ${run}`,
          nameAr: "عيادة الاختبار",
        },
      })
    ).id;

    otherClinicId = (
      await prisma.clinic.create({
        data: {
          name: `Other ${run}`,
        },
      })
    ).id;

    const account = async (
      email: string,
      role: "owner" | "admin" | "practitioner" | "financial",
    ) => {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: "synthetic-unused",
          emailVerifiedAt: new Date(),
        },
      });

      const member = await prisma.clinicUser.create({
        data: {
          userId: user.id,
          clinicId,
          name: role,
          role,
        },
      });

      const auth: AuthUser = {
        userId: user.id,
        clinicId,
        clinicUserId: member.id,
        role,
      };

      users.set(role, auth);

      return auth;
    };

    owner = await account(ownerEmail, "owner");

    doctor = await account(
      `doctor-${run}@example.com`,
      "practitioner",
    );

    await account(
      `admin-${run}@example.com`,
      "admin",
    );

    await account(
      `financial-${run}@example.com`,
      "financial",
    );

    departmentId = (
      await prisma.department.create({
        data: {
          clinicId,
          name: "Clinical",
        },
      })
    ).id;

    serviceId = (
      await prisma.service.create({
        data: {
          clinicId,
          departmentId,
          name: "Visit",
          fee: 20,
        },
      })
    ).id;

    patientId = (
      await prisma.patient.create({
        data: {
          clinicId,
          firstNameEn: "Patient",
          lastNameEn: "One",
          firstNameAr: "أحمد",
          lastNameAr: "عرب",
          email: `patient-${run}@example.com`,
        },
      })
    ).id;

    otherPatientId = (
      await prisma.patient.create({
        data: {
          clinicId: otherClinicId,
          firstNameEn: "Other",
          lastNameEn: "Clinic",
          email: `other-${run}@example.com`,
        },
      })
    ).id;

    await prisma.appointment.create({
      data: {
        clinicId,
        doctorId: doctor.clinicUserId,
        patientId,
        departmentId,
        serviceId,
        scheduledAt: new Date("2026-10-15T10:00:00Z"),
        status: "confirmed",
        isPaid: false,
      },
    });

    const module = await Test.createTestingModule({
      imports: [
        PrismaModule,
        InfrastructureModule,
        EmailsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(EmailService)
      .useValue({
        get isEnabled() {
          return enabled;
        },
        senderAddress: "Cureva <test@example.com>",
        send: async (input: SendEmailInput) => {
          sent.push(input);

          if (fail) {
            throw new Error("synthetic timeout");
          }

          return {
            id: randomUUID(),
            skipped: false,
          };
        },
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{
            headers: {
              authorization?: string;
            };
            user?: AuthUser;
          }>();

          const user = users.get(
            req.headers.authorization || "",
          );

          if (!user) {
            throw new UnauthorizedException();
          }

          req.user = user;

          return true;
        },
      })
      .compile();

    app = module.createNestApplication({
      rawBody: true,
    });

    app.useLogger(false);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    api = request(app.getHttpServer() as Server);
    worker = app.get(EmailDispatchWorker);
  }, 60000);

  beforeEach(async () => {
    fail = false;
    enabled = true;

    await prisma.authRateLimit.deleteMany();
  });

  afterAll(async () => {
    if (app) await app.close();

    if (prisma && clinicId) {
      const scope = {
        clinicId: {
          in: [clinicId, otherClinicId].filter(Boolean),
        },
      };

      await prisma.appointment.deleteMany({
        where: scope,
      });

      await prisma.patient.deleteMany({
        where: scope,
      });

      await prisma.service.deleteMany({
        where: scope,
      });

      await prisma.clinicUser.deleteMany({
        where: scope,
      });

      await prisma.department.deleteMany({
        where: scope,
      });

      await prisma.clinic.deleteMany({
        where: {
          id: {
            in: [clinicId, otherClinicId].filter(Boolean),
          },
        },
      });

      await prisma.user.deleteMany({
        where: {
          email: {
            contains: run,
          },
        },
      });
    }

    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();

    Object.entries({
      EMAIL_WORKER_ENABLED: original.worker,
      RESEND_WEBHOOK_SECRET: original.webhook,
      JWT_SECRET: original.jwt,
    }).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  it("blocks unauthenticated and non-operations users", async () => {
    await api.get("/emails").expect(401);

    await Promise.all(
      ["practitioner", "financial"].map((role) =>
        api
          .get("/emails")
          .set("Authorization", role)
          .expect(403),
      ),
    );

    await api
      .get("/emails")
      .set("Authorization", "admin")
      .expect(200);
  });

  it("validates nested selections", async () => {
    await send({
      ...content(),
      filters: {
        audience: "patients",
        ids: ["invalid"],
      },
    }).expect(400);

    await send({
      ...content(),
      externalRecipients: [
        { email: "invalid" },
      ],
    }).expect(400);

    await send({
      ...content(),
      subject: "Subject\nBcc: malicious",
      externalRecipients: [
        { email: "valid@example.com" },
      ],
    }).expect(400);

    await api
      .post("/emails/recipients/preview")
      .set("Authorization", "owner")
      .send({})
      .expect(400);
  });

  it("combines criteria on the same appointment", async () => {
    const response = await api
      .post("/emails/recipients/preview")
      .set("Authorization", "owner")
      .send({
        filters: {
          audience: "patients",
          doctorId: doctor.clinicUserId,
          departmentId,
          serviceId,
          appointmentStatuses: ["confirmed"],
          appointmentFrom: "2026-10-15T00:00:00Z",
          appointmentTo: "2026-10-16T00:00:00Z",
          isPaid: false,
        },
      })
      .expect(200);

    expect(response.body.count).toBe(1);
    expect(
      response.body.recipients[0].sourceId,
    ).toBe(patientId);

    await send({
      ...content(),
      filters: {
        audience: "patients",
        ids: [otherPatientId],
      },
    }).expect(400);
  });

  it("ignores a client clinicId as authority", async () => {
    const response = await api
      .post("/emails/recipients/preview")
      .set("Authorization", "owner")
      .send({
        clinicId: otherClinicId,
        filters: {
          audience: "patients",
        },
      })
      .expect(200);

    expect(
      response.body.recipients.map(
        (r: { sourceId: string }) => r.sourceId,
      ),
    ).toEqual([patientId]);
  });

  it("deduplicates recipients and applies exclusions", async () => {
    const response = await api
      .post("/emails/recipients/preview")
      .set("Authorization", "owner")
      .send({
        filters: {
          audience: "patients",
        },
        externalRecipients: [
          {
            email: `PATIENT-${run}@example.com`,
          },
          {
            email: "extra@example.com",
          },
        ],
        excludedEmails: [
          "extra@example.com",
        ],
      })
      .expect(200);

    expect(response.body.count).toBe(1);
  });

  it("rejects incompatible and reversed date filters", async () => {
    await api
      .post("/emails/recipients/preview")
      .set("Authorization", "owner")
      .send({
        filters: {
          audience: "owners",
          doctorId: doctor.clinicUserId,
        },
      })
      .expect(400);

    await api
      .post("/emails/recipients/preview")
      .set("Authorization", "owner")
      .send({
        filters: {
          audience: "patients",
          appointmentFrom: "2026-10-16",
          appointmentTo: "2026-10-15",
        },
      })
      .expect(400);
  });

  it("previews escaped bilingual content without sending", async () => {
    const before = sent.length;

    const response = await api
      .post("/emails/preview")
      .set("Authorization", "owner")
      .send({
        locale: "ar",
        subject: "{{clinicName}}",
        body: "<script>x</script> {{recipientName}}",
        recipient: {
          audience: "patients",
          id: patientId,
        },
      })
      .expect(200);

    expect(response.body.html).toContain('dir="rtl"');
    expect(response.body.html).not.toContain("<script>");
    expect(sent).toHaveLength(before);
  });

  it("queues atomically and reuses request IDs", async () => {
    const payload = {
      ...content(),
      externalRecipients: [
        {
          email: "delivery@example.com",
          name: "Person",
        },
      ],
    };

    const before = sent.length;
    const first = await send(payload).expect(202);

    lastMessageId = first.body.id;

    const second = await send(payload).expect(202);

    expect(second.body.id).toBe(first.body.id);
    expect(first.body.counts.queued).toBe(1);
    expect(sent).toHaveLength(before);

    await send({
      ...payload,
      body: "Changed",
    }).expect(409);

    expect(
      await prisma.emailRecipient.count({
        where: {
          messageId: first.body.id,
        },
      }),
    ).toBe(1);
  });

  it("prevents reading another clinic message", async () => {
    const foreign = await prisma.emailMessage.create({
      data: {
        clinicId: otherClinicId,
        createdById: "synthetic",
        requestId: randomUUID(),
        requestHash: "test",
        subject: "Other",
        body: "Other",
        locale: "en",
      },
    });

    await api
      .get(`/emails/${foreign.id}`)
      .set("Authorization", "owner")
      .expect(404);
  });

  it("dispatches with a stable provider idempotency key", async () => {
    await worker.tick();

    const recipient =
      await prisma.emailRecipient.findFirstOrThrow({
        where: {
          messageId: lastMessageId,
        },
      });

    expect(recipient.status).toBe("accepted");

    expect(sent.at(-1)?.to).toBe(
      "delivery@example.com",
    );

    expect(sent.at(-1)?.idempotencyKey).toBe(
      `cureva-email/${recipient.id}`,
    );
  });

  const webhook = async (
    recipient: EmailRecipient,
    type: string,
    eventId = randomUUID(),
    createdAt = new Date().toISOString(),
  ) => {
    const payload = JSON.stringify({
      type,
      created_at: createdAt,
      data: {
        email_id: recipient.providerId || randomUUID(),
        from: "test@example.com",
        to: [recipient.email],
        subject: "Synthetic",
        created_at: createdAt,
        tags: {
          cureva_recipient: recipient.id,
        },
      },
    });

    const timestamp = String(
      Math.floor(Date.now() / 1000),
    );

    const signature = createHmac(
      "sha256",
      Buffer.from(secret, "base64"),
    )
      .update(`${eventId}.${timestamp}.${payload}`)
      .digest("base64");

    return api
      .post("/emails/webhooks/resend")
      .set("Content-Type", "application/json")
      .set("svix-id", eventId)
      .set("svix-timestamp", timestamp)
      .set("svix-signature", `v1,${signature}`)
      .send(payload);
  };

  it("verifies signatures and preserves event ordering", async () => {
    await api
      .post("/emails/webhooks/resend")
      .send({})
      .expect(401);

    const recipient =
      await prisma.emailRecipient.findFirstOrThrow({
        where: {
          messageId: lastMessageId,
        },
      });

    const eventId = randomUUID();

    expect(
      (
        await webhook(
          recipient,
          "email.delivered",
          eventId,
        )
      ).status,
    ).toBe(200);

    expect(
      (
        await prisma.emailRecipient.findUniqueOrThrow({
          where: {
            id: recipient.id,
          },
        })
      ).status,
    ).toBe("delivered");

    expect(
      (
        await webhook(
          recipient,
          "email.delivered",
          eventId,
        )
      ).status,
    ).toBe(200);

    expect(
      (
        await webhook(
          recipient,
          "email.sent",
          randomUUID(),
          "2026-01-01T00:00:00Z",
        )
      ).status,
    ).toBe(200);

    expect(
      (
        await prisma.emailRecipient.findUniqueOrThrow({
          where: {
            id: recipient.id,
          },
        })
      ).status,
    ).toBe("delivered");
  });

  it("suppresses complaints from future selections", async () => {
    const recipient =
      await prisma.emailRecipient.findFirstOrThrow({
        where: {
          messageId: lastMessageId,
        },
      });

    expect(
      (
        await webhook(
          recipient,
          "email.complained",
        )
      ).status,
    ).toBe(200);

    const response = await api
      .post("/emails/recipients/preview")
      .set("Authorization", "owner")
      .send({
        externalRecipients: [
          {
            email: recipient.email,
          },
        ],
      })
      .expect(200);

    expect(response.body.count).toBe(0);

    await send({
      ...content(),
      externalRecipients: [
        {
          email: recipient.email,
        },
      ],
    }).expect(400);
  });

  it("retries failures and reclaims expired leases", async () => {
    const response = await send({
      ...content(),
      externalRecipients: [
        {
          email: "retry@example.com",
        },
      ],
    }).expect(202);

    fail = true;

    await worker.tick();

    const recipient =
      await prisma.emailRecipient.findFirstOrThrow({
        where: {
          messageId: response.body.id,
        },
      });

    expect(recipient.status).toBe("queued");
    expect(recipient.attempts).toBe(1);

    expect(recipient.lastError).toBe(
      "emailDeliveryFailed",
    );

    await prisma.emailRecipient.update({
      where: {
        id: recipient.id,
      },
      data: {
        status: "processing",
        leaseToken: "expired",
        leaseUntil: new Date(0),
      },
    });

    fail = false;

    await prisma.authRateLimit.deleteMany();
    await worker.tick();

    expect(
      (
        await prisma.emailRecipient.findUniqueOrThrow({
          where: {
            id: recipient.id,
          },
        })
      ).status,
    ).toBe("accepted");

    expect(sent.at(-1)?.idempotencyKey).toBe(
      `cureva-email/${recipient.id}`,
    );
  });

  it("stops retrying outside the safe window", async () => {
    const response = await send({
      ...content(),
      externalRecipients: [
        {
          email: "expired@example.com",
        },
      ],
    }).expect(202);

    const recipient =
      await prisma.emailRecipient.findFirstOrThrow({
        where: {
          messageId: response.body.id,
        },
      });

    await prisma.emailRecipient.update({
      where: {
        id: recipient.id,
      },
      data: {
        firstAttemptAt: new Date(
          Date.now() - 24 * 3600_000,
        ),
      },
    });

    const before = sent.length;

    await worker.tick();

    expect(sent).toHaveLength(before);

    expect(
      (
        await prisma.emailRecipient.findUniqueOrThrow({
          where: {
            id: recipient.id,
          },
        })
      ).lastError,
    ).toBe("emailRetryWindowExpired");
  });

  it("restricts tests to the current user's email", async () => {
    const response = await api
      .post("/emails/test")
      .set("Authorization", "owner")
      .send({
        ...content(),
        to: "someoneelse@example.com",
      })
      .expect(202);

    expect(
      response.body.recipients[0].email,
    ).toBe(ownerEmail);
  });

  it("fails closed when sending is unavailable", async () => {
    enabled = false;

    await send({
      ...content(),
      externalRecipients: [
        {
          email: "unavailable@example.com",
        },
      ],
    }).expect(503);
  });

  it("restricts branding writes and replaces settings", async () => {
    await api
      .put("/emails/settings")
      .set("Authorization", "admin")
      .send({
        footerEn: "No",
      })
      .expect(403);

    await api
      .put("/emails/settings")
      .set("Authorization", "owner")
      .send({
        websiteUrl: "javascript:alert(1)",
      })
      .expect(400);

    await api
      .put("/emails/settings")
      .set("Authorization", "owner")
      .send({
        websiteUrl: "https://clinic.example.com",
        footerAr: "العيادة",
      })
      .expect(200);

    const result = await api
      .put("/emails/settings")
      .set("Authorization", "owner")
      .send({
        footerEn: "Updated",
      })
      .expect(200);

    expect(result.body.websiteUrl).toBeUndefined();
    expect(result.body.footerEn).toBe("Updated");
  });
});
