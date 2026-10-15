const path = require("node:path");
process.chdir(path.resolve(__dirname, ".."));

require("ts-node/register/transpile-only");
require("tsconfig-paths/register");

const { PGlite } = require("@electric-sql/pglite");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { EventEmitter } = require("node:events");
const { readFileSync } = require("node:fs");
const { randomUUID } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const assert = require("node:assert/strict");

const {
  EmailsRepository,
} = require("../src/modules/emails/emails.repository");

const {
  EmailAudienceRepository,
} = require("../src/modules/emails/email-audience.repository");

const {
  EmailsService,
} = require("../src/modules/emails/emails.service");

const {
  EmailDispatchWorker,
} = require("../src/modules/emails/email-dispatch.worker");

const {
  EmailWebhooksService,
} = require("../src/modules/emails/email-webhooks.service");

const {
  RateLimitService,
} = require("../src/security/services/rate-limit.service");

class InProcessPool extends Pool {
  constructor(db) {
    super();
    this.db = db;
    this.tail = Promise.resolve();
  }

  async lock() {
    let unlock;
    const before = this.tail;

    this.tail = new Promise((resolve) => {
      unlock = resolve;
    });

    await before;

    return unlock;
  }

  async run(config, values) {
    const query =
      typeof config === "string"
        ? { text: config, values }
        : config;

    const parsers = new Proxy(
      {},
      {
        get: (_, key) =>
          query.types?.getTypeParser(Number(key), "text"),
      },
    );

    const result = await this.db.query(
      query.text,
      query.values || [],
      {
        rowMode: query.rowMode || "object",
        parsers,
      },
    );

    return {
      ...result,
      rowCount: result.affectedRows ?? result.rows.length,
    };
  }

  async query(config, values) {
    const release = await this.lock();

    try {
      return await this.run(config, values);
    } finally {
      release();
    }
  }

  async connect() {
    const release = await this.lock();
    const client = new EventEmitter();

    client.query = (config, values) =>
      this.run(config, values);

    client.release = release;

    return client;
  }

  async end() {}
}

(async () => {
  process.env.JWT_SECRET =
    "inprocess-synthetic-test-secret";

  const schema = process.env.EMAIL_TEST_SCHEMA_SQL
    ? readFileSync(
        process.env.EMAIL_TEST_SCHEMA_SQL,
        "utf8",
      )
    : execFileSync(
        process.execPath,
        [
          path.resolve(
            "node_modules/prisma/build/index.js",
          ),
          "migrate",
          "diff",
          "--from-empty",
          "--to-schema",
          "prisma/schema.prisma",
          "--script",
        ],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            DIRECT_URL:
              "postgresql://unused:unused@localhost:5432/unused",
          },
        },
      );

  const db = await PGlite.create();
  await db.exec(schema);

  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      new InProcessPool(db),
    ),
  });

  const clinic = await prisma.clinic.create({
    data: {
      name: "Synthetic Clinic",
      nameAr: "عيادة الاختبار",
    },
  });

  const foreign = await prisma.clinic.create({
    data: {
      name: "Foreign Clinic",
    },
  });

  const account = await prisma.user.create({
    data: {
      email: "owner@example.com",
      passwordHash: "synthetic",
    },
  });

  const owner = await prisma.clinicUser.create({
    data: {
      clinicId: clinic.id,
      userId: account.id,
      role: "owner",
      name: "Owner",
    },
  });

  const doctorAccount = await prisma.user.create({
    data: {
      email: "doctor@example.com",
      passwordHash: "synthetic",
    },
  });

  const doctor = await prisma.clinicUser.create({
    data: {
      clinicId: clinic.id,
      userId: doctorAccount.id,
      role: "practitioner",
      name: "Doctor",
    },
  });

  const department = await prisma.department.create({
    data: {
      clinicId: clinic.id,
      name: "Department",
    },
  });

  const service = await prisma.service.create({
    data: {
      clinicId: clinic.id,
      departmentId: department.id,
      name: "Visit",
      fee: 20,
    },
  });

  const patient = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      firstNameEn: "Patient",
      lastNameEn: "One",
      firstNameAr: "أحمد",
      lastNameAr: "عرب",
      email: "patient@example.com",
    },
  });

  const foreignPatient = await prisma.patient.create({
    data: {
      clinicId: foreign.id,
      firstNameEn: "Foreign",
      lastNameEn: "Patient",
      email: "foreign@example.com",
    },
  });

  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      doctorId: doctor.id,
      patientId: patient.id,
      departmentId: department.id,
      serviceId: service.id,
      scheduledAt: new Date("2026-10-15T10:00:00Z"),
      status: "confirmed",
      isPaid: false,
    },
  });

  const repo = new EmailsRepository(prisma);
  const audience = new EmailAudienceRepository(prisma);
  const limits = new RateLimitService(prisma);

  let fail = false;
  const sent = [];

  const email = {
    isEnabled: true,
    senderAddress: "Clinic <sender@example.com>",
    send: async (input) => {
      sent.push(input);

      if (fail) {
        throw new Error("synthetic timeout");
      }

      return {
        id: randomUUID(),
        skipped: false,
      };
    },
  };

  const emails = new EmailsService(
    repo,
    audience,
    email,
    prisma,
    limits,
  );

  const worker = new EmailDispatchWorker(
    prisma,
    email,
    limits,
  );

  const hooks = new EmailWebhooksService(prisma);

  const user = {
    userId: account.id,
    clinicUserId: owner.id,
    clinicId: clinic.id,
    role: "owner",
  };

  let passed = 0;

  const ok = (label) => {
    passed++;
    console.log("PASS " + label);
  };

  const content = () => ({
    requestId: randomUUID(),
    locale: "en",
    subject: "Hello {{recipientName}}",
    body: "From {{clinicName}}",
  });

  const clear = () =>
    prisma.authRateLimit.deleteMany();

  const selected = await audience.resolve(
    clinic.id,
    {
      filters: {
        audience: "patients",
        doctorId: doctor.id,
        departmentId: department.id,
        serviceId: service.id,
        appointmentStatuses: ["confirmed"],
        isPaid: false,
        appointmentFrom: "2026-10-15T00:00:00Z",
        appointmentTo: "2026-10-16T00:00:00Z",
      },
    },
  );

  assert.equal(selected.length, 1);
  assert.equal(selected[0].sourceId, patient.id);
  ok("combined appointment filters and tenant isolation");

  await assert.rejects(() =>
    audience.resolve(clinic.id, {
      filters: {
        audience: "patients",
        ids: [foreignPatient.id],
      },
    }),
  );

  ok("foreign recipient rejected");

  assert.equal(
    (
      await audience.resolve(clinic.id, {
        filters: {
          audience: "patients",
        },
        externalRecipients: [
          { email: "PATIENT@example.com" },
          { email: "extra@example.com" },
        ],
        excludedEmails: [
          "extra@example.com",
        ],
      })
    ).length,
    1,
  );

  ok("deduplication and exclusions");

  const preview = await emails.preview(user, {
    locale: "ar",
    subject: "{{clinicName}}",
    body: "<script>x</script> {{recipientName}}",
    recipient: {
      audience: "patients",
      id: patient.id,
    },
  });

  assert.ok(preview.html.includes('dir="rtl"'));
  assert.ok(preview.text.includes("أحمد عرب"));
  assert.ok(!preview.html.includes("<script>"));
  ok("Arabic personalized preview escapes HTML");

  const payload = {
    ...content(),
    externalRecipients: [
      {
        email: "delivery@example.com",
        name: "Recipient",
      },
    ],
  };

  const message = await emails.send(user, payload);

  assert.equal(message.counts.queued, 1);
  assert.equal(sent.length, 0);
  ok("transactional enqueue without inline sending");

  assert.equal(
    (await emails.send(user, payload)).id,
    message.id,
  );

  await assert.rejects(() =>
    emails.send(user, {
      ...payload,
      body: "Changed",
    }),
  );

  ok("request idempotency and payload conflict");

  await assert.rejects(() =>
    repo.detail(
      foreign.id,
      message.id,
      { page: 1, limit: 20 },
    ),
  );

  ok("foreign history access rejected");

  await clear();
  await worker.tick();

  const recipient =
    await prisma.emailRecipient.findFirstOrThrow({
      where: {
        messageId: message.id,
      },
    });

  assert.equal(recipient.status, "accepted");

  assert.equal(
    sent.at(-1).idempotencyKey,
    "cureva-email/" + recipient.id,
  );

  ok("PostgreSQL dispatch and provider idempotency");

  const event = (type, at) => ({
    type,
    created_at: at || new Date().toISOString(),
    data: {
      email_id: recipient.providerId,
      tags: {
        cureva_recipient: recipient.id,
      },
    },
  });

  const eventId = randomUUID();

  await hooks.apply(
    eventId,
    event("email.delivered"),
  );

  await hooks.apply(
    eventId,
    event("email.delivered"),
  );

  await hooks.apply(
    randomUUID(),
    event("email.sent", "2026-01-01T00:00:00Z"),
  );

  assert.equal(
    (
      await prisma.emailRecipient.findUniqueOrThrow({
        where: {
          id: recipient.id,
        },
      })
    ).status,
    "delivered",
  );

  ok("webhook replay and out-of-order events");

  await hooks.apply(
    randomUUID(),
    event("email.complained"),
  );

  assert.equal(
    (
      await audience.resolve(clinic.id, {
        externalRecipients: [
          {
            email: recipient.email,
          },
        ],
      })
    ).length,
    0,
  );

  ok("complaint suppression");

  await clear();

  const retry = await emails.send(user, {
    ...content(),
    externalRecipients: [
      {
        email: "retry@example.com",
      },
    ],
  });

  await clear();

  fail = true;
  await worker.tick();

  let retryRecipient =
    await prisma.emailRecipient.findFirstOrThrow({
      where: {
        messageId: retry.id,
      },
    });

  assert.equal(retryRecipient.status, "queued");
  assert.equal(retryRecipient.attempts, 1);
  ok("provider failure schedules retry");

  await prisma.emailRecipient.update({
    where: {
      id: retryRecipient.id,
    },
    data: {
      status: "processing",
      leaseToken: "expired",
      leaseUntil: new Date(0),
    },
  });

  await clear();

  fail = false;
  await worker.tick();

  retryRecipient =
    await prisma.emailRecipient.findUniqueOrThrow({
      where: {
        id: retryRecipient.id,
      },
    });

  assert.equal(retryRecipient.status, "accepted");

  assert.equal(
    sent.at(-1).idempotencyKey,
    "cureva-email/" + retryRecipient.id,
  );

  ok("expired lease recovery preserves idempotency");

  await clear();

  const expired = await emails.send(user, {
    ...content(),
    externalRecipients: [
      {
        email: "expired@example.com",
      },
    ],
  });

  const expiredRecipient =
    await prisma.emailRecipient.findFirstOrThrow({
      where: {
        messageId: expired.id,
      },
    });

  await prisma.emailRecipient.update({
    where: {
      id: expiredRecipient.id,
    },
    data: {
      firstAttemptAt: new Date(
        Date.now() - 24 * 3600_000,
      ),
    },
  });

  await clear();

  const before = sent.length;

  await worker.tick();

  assert.equal(sent.length, before);

  assert.equal(
    (
      await prisma.emailRecipient.findUniqueOrThrow({
        where: {
          id: expiredRecipient.id,
        },
      })
    ).lastError,
    "emailRetryWindowExpired",
  );

  ok("retry expiry prevents duplicate send");

  await clear();

  const test = await emails.test(
    user,
    content(),
  );

  assert.equal(
    test.recipients[0].email,
    "owner@example.com",
  );

  ok("test email targets current member");

  await repo.replaceSettings(clinic.id, {
    websiteUrl: "https://clinic.example.com",
    footerAr: "عيادة",
  });

  await repo.replaceSettings(clinic.id, {
    footerEn: "Footer",
  });

  assert.equal(
    (await repo.settings(clinic.id)).websiteUrl,
    null,
  );

  ok("settings PUT replacement semantics");

  const history = await repo.list(
    clinic.id,
    { page: 1, limit: 2 },
  );

  assert.equal(history.items.length, 2);
  assert.ok(history.total >= 3);
  ok("paginated history and delivery counts");

  await prisma.$disconnect();
  await db.close();

  console.log(
    `${passed} PostgreSQL-backed scenarios passed`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
