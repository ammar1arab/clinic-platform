import type { DashboardGateway } from "@/modules/dashboard/dashboard.gateway";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Role, type Prisma } from "@prisma/client";
import type { AuthUser } from "@/modules/auth/types";
import type { NotificationsService } from "@/modules/notifications/notifications.service";
import type { PractitionersRepository } from "./practitioners.repository";
import { ScheduleRequestsService } from "./schedule-requests.service";

const practitioner: AuthUser = {
  clinicId: "clinic",
  clinicUserId: "doctor",
  userId: "user",
  role: Role.practitioner,
};
const owner: AuthUser = {
  ...practitioner,
  clinicUserId: "owner",
  role: Role.owner,
};
const period = {
  startAt: new Date(Date.now() + 86400000),
  endAt: new Date(Date.now() + 90000000),
};
const pending = {
  id: "request",
  clinicId: "clinic",
  doctorId: "doctor",
  kind: "leave",
  status: "pending",
  reason: "Family commitment",
  ...period,
};

describe("Schedule requests", () => {
  const tx = {
    clinicUser: { findFirst: jest.fn() },
    practitionerScheduleRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    doctorTimeOff: { findFirst: jest.fn(), create: jest.fn() },
    doctorAvailabilityOverride: { findFirst: jest.fn(), create: jest.fn() },
  };
  const repo = {
    scheduleRequests: jest.fn(),
    scheduleReviewers: jest.fn(),
    assertLeaveAvailable: jest.fn(),
    scheduleWrite: jest.fn(),
  };
  const notifications = { create: jest.fn() };
  const gateway = { emitScheduleRequestChanged: jest.fn() };
  const service = new ScheduleRequestsService(
    repo as unknown as PractitionersRepository,
    notifications as unknown as NotificationsService,
    gateway as unknown as DashboardGateway,
  );
  beforeEach(() => {
    jest.resetAllMocks();
    repo.scheduleWrite.mockImplementation(
      (
        _clinicId: string,
        operation: (client: Prisma.TransactionClient) => Promise<unknown>,
      ) => operation(tx as unknown as Prisma.TransactionClient),
    );
    tx.clinicUser.findFirst.mockResolvedValue({ id: "doctor", isActive: true });
    repo.scheduleReviewers.mockResolvedValue([{ id: "owner" }]);
    tx.practitionerScheduleRequest.findFirst.mockResolvedValue(pending);
    tx.practitionerScheduleRequest.update.mockImplementation(
      async ({ data }: { data: object }) => ({ ...pending, ...data }),
    );
  });

  it("broadcasts request changes independently of inbox preferences", async () => {
    notifications.create.mockResolvedValue(null);
    await service.review(owner, "request", { decision: "approved" });
    expect(gateway.emitScheduleRequestChanged).toHaveBeenCalledWith("clinic", true);
  });
  it("scopes practitioner lists to themselves even when another doctor is requested", () => {
    service.list(practitioner, {
      doctorId: "other",
      group: "pending",
      sort: "newest",
      page: 1,
    });
    expect(repo.scheduleRequests).toHaveBeenCalledWith("clinic", {
      doctorId: "doctor",
      departmentId: undefined,
      group: "pending",
      sort: "newest",
      page: 1,
    });
  });
  it("scopes review reads to the authenticated clinic", async () => {
    tx.practitionerScheduleRequest.findFirst.mockResolvedValue(null);
    await expect(
      service.review(owner, "foreign", { decision: "approved" }),
    ).rejects.toThrow(NotFoundException);
    expect(tx.practitionerScheduleRequest.findFirst).toHaveBeenCalledWith({
      where: { id: "foreign", clinicId: "clinic" },
    });
  });
  it("prevents a practitioner approving their own request", async () => {
    await expect(
      service.review(practitioner, "request", { decision: "approved" }),
    ).rejects.toThrow(ForbiddenException);
    expect(tx.doctorTimeOff.create).not.toHaveBeenCalled();
  });
  it("does not apply a request twice", async () => {
    tx.practitionerScheduleRequest.findFirst.mockResolvedValue({
      ...pending,
      status: "approved",
    });
    await expect(
      service.review(owner, "request", { decision: "approved" }),
    ).rejects.toThrow(ConflictException);
    expect(tx.doctorTimeOff.create).not.toHaveBeenCalled();
  });
  it("requires a decline reason without changing availability", async () => {
    await expect(
      service.review(owner, "request", { decision: "declined" }),
    ).rejects.toThrow(BadRequestException);
    await service.review(owner, "request", {
      decision: "declined",
      reviewNote: "Coverage required",
    });
    expect(tx.doctorTimeOff.create).not.toHaveBeenCalled();
    expect(tx.doctorAvailabilityOverride.create).not.toHaveBeenCalled();
  });
  it("allows only the requester to withdraw pending requests", async () => {
    await expect(
      service.review(owner, "request", { decision: "withdrawn" }),
    ).rejects.toThrow(ForbiddenException);
    await service.review(practitioner, "request", { decision: "withdrawn" });
    expect(tx.doctorTimeOff.create).not.toHaveBeenCalled();
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({ userId: "owner", type: "schedule_request_withdrawn" }));
  });
  it.each(["approved", "declined", "withdrawn"])("does not allow withdrawing a %s request", async (status) => {
    tx.practitionerScheduleRequest.findFirst.mockResolvedValue({ ...pending, status });
    await expect(service.review(practitioner, "request", { decision: "withdrawn" })).rejects.toThrow(ConflictException);
    expect(tx.practitionerScheduleRequest.update).not.toHaveBeenCalled();
    expect(tx.doctorTimeOff.create).not.toHaveBeenCalled();
    expect(tx.doctorAvailabilityOverride.create).not.toHaveBeenCalled();
  });
  it("blocks leave when an active appointment intersects the period", async () => {
    repo.assertLeaveAvailable.mockRejectedValue(new ConflictException());
    await expect(
      service.review(owner, "request", { decision: "approved" }),
    ).rejects.toThrow(ConflictException);
    expect(tx.doctorTimeOff.create).not.toHaveBeenCalled();
    expect(tx.practitionerScheduleRequest.update).not.toHaveBeenCalled();
  });
  it("applies approved leave using the existing time-off model", async () => {
    await service.review(owner, "request", { decision: "approved" });
    expect(tx.doctorTimeOff.create).toHaveBeenCalledWith({
      data: {
        doctorId: "doctor",
        startDate: period.startAt,
        endDate: period.endAt,
        reason: pending.reason,
      },
    });
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: "clinic",
        userId: "doctor",
        type: "schedule_request_approved",
      }),
    );
  });
  it("applies extra hours using the existing override model", async () => {
    tx.practitionerScheduleRequest.findFirst.mockResolvedValue({
      ...pending,
      kind: "extra",
    });
    await service.review(owner, "request", { decision: "approved" });
    expect(tx.doctorAvailabilityOverride.create).toHaveBeenCalled();
    expect(tx.doctorTimeOff.create).not.toHaveBeenCalled();
  });
  it("allows leave to override extra hours without rewriting the extra shift", async () => {
    tx.doctorAvailabilityOverride.findFirst.mockResolvedValue({ id: "extra" });
    await service.review(owner, "request", { decision: "approved" });
    expect(tx.doctorTimeOff.create).toHaveBeenCalled();
    expect(tx.doctorAvailabilityOverride.findFirst).not.toHaveBeenCalled();
  });
  it("rejects overlap with existing exceptions", async () => {
    tx.doctorTimeOff.findFirst.mockResolvedValue({ id: "leave" });
    await expect(
      service.review(owner, "request", { decision: "approved" }),
    ).rejects.toThrow(ConflictException);
    expect(tx.practitionerScheduleRequest.update).not.toHaveBeenCalled();
  });
  it("rejects reversed or past request dates", async () => {
    await expect(
      service.create(practitioner, {
        kind: "leave",
        startAt: period.endAt.toISOString(),
        endAt: period.startAt.toISOString(),
        reason: pending.reason,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.scheduleWrite).not.toHaveBeenCalled();
  });
  it("creates a pending request without changing bookings", async () => {
    tx.practitionerScheduleRequest.findFirst.mockResolvedValue(null);
    tx.practitionerScheduleRequest.create.mockResolvedValue(pending);
    await service.create(practitioner, {
      kind: "leave",
      startAt: period.startAt.toISOString(),
      endAt: period.endAt.toISOString(),
      reason: pending.reason,
    });
    expect(tx.doctorTimeOff.create).not.toHaveBeenCalled();
    expect(tx.doctorAvailabilityOverride.create).not.toHaveBeenCalled();
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "owner",
        type: "schedule_request_pending",
      }),
    );
  });
});
