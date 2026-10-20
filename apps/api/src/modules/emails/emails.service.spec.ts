import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { EMAIL_AUDIENCE, LOCALE, ROLE } from "@clinic/types";
import type { AuthUser } from "@/modules/auth/types";
import { EmailService } from "@/infrastructure/email.service";
import { RateLimitService } from "@/security/services/rate-limit.service";
import { emailSelectionHash, EmailsService } from "./emails.service";
import { EmailsRepository } from "./emails.repository";
import { EmailAudienceRepository } from "./email-audience.repository";

const user: AuthUser = {
  userId: randomUUID(),
  clinicId: randomUUID(),
  clinicUserId: randomUUID(),
  role: ROLE.OWNER,
};

const recipients = [
  {
    sourceId: "patient-id",
    audience: EMAIL_AUDIENCE.PATIENTS,
    name: "Patient",
    nameAr: "أحمد",
    email: "patient@example.com",
  },
];

const payload = (rows = recipients) => ({
  requestId: randomUUID(),
  locale: LOCALE.EN,
  subject: "Hi {{recipientName}}",
  body: "Body",
  selectionHash: emailSelectionHash(user.clinicId, rows),
  filters: {
    audience: EMAIL_AUDIENCE.PATIENTS,
  },
});

describe("EmailsService", () => {
  const repo = {
    findRequest: jest.fn(),
    create: jest.fn(),
    detail: jest.fn(),
    brand: jest.fn(),
    testRecipient: jest.fn(),
  };

  const audience = {
    resolve: jest.fn(),
  };

  const email = {
    isEnabled: true,
    senderAddress: "Clinic <mail@example.com>",
  };

  const limits = {
    consume: jest.fn(),
  };

  let service: EmailsService;

  beforeEach(() => {
    jest.resetAllMocks();
    email.isEnabled = true;

    repo.brand.mockResolvedValue({
      name: "Clinic",
      nameAr: "عيادة",
      logoUrl: null,
      timezone: "UTC",
      replyTo: "reply@example.com",
    });

    audience.resolve.mockResolvedValue(recipients);

    repo.create.mockResolvedValue({
      id: "message-id",
    });

    repo.detail.mockResolvedValue({
      id: "message-id",
      counts: { queued: 1 },
    });

    service = new EmailsService(
      repo as Partial<EmailsRepository> as EmailsRepository,
      audience as Partial<EmailAudienceRepository> as EmailAudienceRepository,
      email as Partial<EmailService> as EmailService,
      limits as Partial<RateLimitService> as RateLimitService,
    );
  });

  it("creates message and recipient snapshots atomically", async () => {
    await service.send(user, payload());

    const data = repo.create.mock.calls[0][0];

    expect(data.clinic.connect.id).toBe(user.clinicId);
    expect(data.createdById).toBe(user.clinicUserId);

    expect(data.recipients.create[0]).toMatchObject({
      subject: "Hi Patient",
      fromAddress: email.senderAddress,
      replyTo: "reply@example.com",
    });

    expect(data.recipients.create[0].nameAr).toBeUndefined();

    expect(
      audience.resolve.mock.calls[0][0],
    ).toBe(user.clinicId);
  });

  it("uses Arabic recipient names", async () => {
    await service.send(user, {
      ...payload(),
      locale: LOCALE.AR,
    });

    expect(
      repo.create.mock.calls[0][0].recipients.create[0].subject,
    ).toBe("Hi أحمد");
  });

  it("does not queue when delivery is disabled", async () => {
    email.isEnabled = false;

    await expect(
      service.send(user, payload()),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it("does not create empty messages", async () => {
    audience.resolve.mockResolvedValue([]);

    await expect(
      service.send(user, payload([])),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it("replays identical requests before provider checks", async () => {
    const dto = payload();

    await service.send(user, dto);

    const requestHash =
      repo.create.mock.calls[0][0].requestHash;

    repo.create.mockClear();

    repo.findRequest.mockResolvedValue({
      id: "message-id",
      requestHash,
    });

    email.isEnabled = false;

    await service.send(user, dto);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it("rejects request IDs reused with different payloads", async () => {
    repo.findRequest.mockResolvedValue({
      id: "existing",
      requestHash: "different",
    });

    await expect(
      service.send(user, payload()),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("sends tests only to the current member", async () => {
    repo.testRecipient.mockResolvedValue({
      id: user.clinicUserId,
      name: "Owner",
      user: {
        email: "owner@example.com",
      },
    });

    await service.test(user, payload());

    expect(
      repo.testRecipient.mock.calls[0],
    ).toEqual([user.clinicId, user.clinicUserId]);

    expect(
      audience.resolve.mock.calls[0][1],
    ).toEqual({
      externalRecipients: [
        {
          email: "owner@example.com",
          name: "Owner",
        },
      ],
    });

    expect(
      repo.create.mock.calls[0][0].isTest,
    ).toBe(true);
  });

  it("refuses unavailable preview recipients", async () => {
    audience.resolve.mockResolvedValue([]);

    await expect(
      service.preview(user, {
        locale: LOCALE.EN,
        subject: "Hi",
        body: "Body",
        recipient: {
          audience: EMAIL_AUDIENCE.PATIENTS,
          id: randomUUID(),
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
