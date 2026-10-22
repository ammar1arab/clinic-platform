import { Test, TestingModule } from "@nestjs/testing";
import { AppointmentsService } from "./appointments.service";
import { AppointmentsRepository } from "./appointments.repository";
import { DashboardGateway } from "@/modules/dashboard/dashboard.gateway";
import { PrismaService } from "@/prisma/prisma.service";
import { DiscountCodesService } from "@/modules/discount-codes/discount-codes.service";
import { PatientPackagesService } from "@/modules/patient-packages/patient-packages.service";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import { BadRequestException, HttpException } from "@nestjs/common";
import { AppointmentStatusDto } from "./dto";
import { Role, type SessionType } from "@prisma/client";

type MockFn = jest.Mock;

type PrismaServiceMock = {
  patient: { findFirst: MockFn };
  clinicUser: { findFirst: MockFn };
  service: { findFirst: MockFn };
  department: { findFirst: MockFn };
  room: { findFirst: MockFn };
  doctorAvailability: { findFirst: MockFn; count: MockFn };
  doctorAvailabilityOverride: { findFirst: MockFn };
  doctorTimeOff: { findFirst: MockFn };
  clinic: { findUnique: MockFn };
  discountCode: { findFirst: MockFn };
  visit: { findFirst: MockFn };
};

type AppointmentsRepositoryMock = {
  create: MockFn;
  findAllByClinic: MockFn;
  findById: MockFn;
  update: MockFn;
  findConflict: MockFn;
  findDoctorConflict: MockFn;
};

type DashboardGatewayMock = {
  emitAppointmentChanged: MockFn;
};

type DiscountCodesServiceMock = {
  validate: MockFn;
  consume: MockFn;
};

describe("AppointmentsService", () => {
  let service: AppointmentsService;
  let prismaService: PrismaServiceMock;
  let repository: AppointmentsRepositoryMock;
  let gateway: DashboardGatewayMock;

  beforeEach(async () => {
    prismaService = {
      patient: { findFirst: jest.fn() },
      clinicUser: { findFirst: jest.fn() },
      service: { findFirst: jest.fn() },
      department: { findFirst: jest.fn() },
      room: { findFirst: jest.fn() },
      doctorAvailability: { findFirst: jest.fn(), count: jest.fn() },
      doctorAvailabilityOverride: { findFirst: jest.fn() },
      doctorTimeOff: { findFirst: jest.fn() },
      clinic: { findUnique: jest.fn() },
      discountCode: { findFirst: jest.fn() },
      visit: { findFirst: jest.fn().mockResolvedValue(null) },
    };

    repository = {
      create: jest.fn(),
      findAllByClinic: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findConflict: jest.fn(),
      findDoctorConflict: jest.fn(),
    };

    gateway = {
      emitAppointmentChanged: jest.fn(),
    };

    const discountCodesService: DiscountCodesServiceMock = {
      validate: jest.fn(),
      consume: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: AppointmentsRepository, useValue: repository },
        { provide: DashboardGateway, useValue: gateway },
        { provide: PrismaService, useValue: prismaService },
        { provide: DiscountCodesService, useValue: discountCodesService },
        { provide: NotificationsService, useValue: { notifyDoctor: jest.fn() } },
        {
          provide: PatientPackagesService,
          useValue: { ensureEnrollment: jest.fn(), summary: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  const helpers = () =>
    service as unknown as {
      calculatePricing: (
        svc: { fee: number } | null,
        feeOverride?: number,
        discount?: number,
        discountType?: string,
        discountReason?: string,
      ) => {
        fee: number;
        discount?: number;
        discountType?: string;
        discountReason?: string;
      };
      validateSessionType: (
        sessionType: string,
        svc: { supportedModes: SessionType[] } | null,
        roomId?: string,
        meetingUrl?: string,
      ) => void;
      validateEntities: (
        clinicId: string,
        dto: { patientId: string; doctorId: string },
      ) => Promise<unknown>;
    };

  describe("Pricing calculation", () => {
    it("should calculate pricing based on service fee", () => {
      const result = helpers().calculatePricing({ fee: 100 });
      expect(result.fee).toBe(100);
      expect(result.discount).toBeUndefined();
    });

    it("should apply fee override if provided", () => {
      const result = helpers().calculatePricing({ fee: 100 }, 150);
      expect(result.fee).toBe(150);
    });

    it("should calculate valid percentage discount", () => {
      const result = helpers().calculatePricing(
        { fee: 100 },
        undefined,
        20,
        "percentage",
        "Staff discount",
      );
      expect(result.discount).toBe(20);
      expect(result.discountType).toBe("percentage");
      expect(result.discountReason).toBe("Staff discount");
    });

    it("should throw error if discount is set without reason", () => {
      expect(() => {
        helpers().calculatePricing({ fee: 100 }, undefined, 20, "percentage");
      }).toThrow(BadRequestException);
    });

    it("should throw error if percentage > 100", () => {
      expect(() => {
        helpers().calculatePricing(
          { fee: 100 },
          undefined,
          120,
          "percentage",
          "Promo",
        );
      }).toThrow(BadRequestException);
    });

    it("should throw error if fixed discount > fee", () => {
      expect(() => {
        helpers().calculatePricing(
          { fee: 100 },
          undefined,
          150,
          "fixed",
          "Promo",
        );
      }).toThrow(BadRequestException);
    });
  });

  describe("Delivery mode rules", () => {
    it("should throw if service does not support sessionType", () => {
      expect(() => {
        helpers().validateSessionType("online", {
          supportedModes: ["in_person"],
        });
      }).toThrow(BadRequestException);
    });

    it("should require roomId for in_person", () => {
      expect(() => {
        helpers().validateSessionType("in_person", null, undefined, undefined);
      }).toThrow(BadRequestException);
    });

    it("should require meetingUrl for online", () => {
      expect(() => {
        helpers().validateSessionType("online", null, undefined, undefined);
      }).toThrow(BadRequestException);
    });

    it("should require HTTPS for meetingUrl", () => {
      expect(() => {
        helpers().validateSessionType(
          "online",
          null,
          undefined,
          "http://example.com",
        );
      }).toThrow(BadRequestException);
    });

    it("should pass for valid in_person", () => {
      expect(() =>
        helpers().validateSessionType("in_person", null, "room123", undefined),
      ).not.toThrow();
    });

    it("should pass for valid online", () => {
      expect(() =>
        helpers().validateSessionType(
          "online",
          null,
          undefined,
          "https://example.com",
        ),
      ).not.toThrow();
    });
  });

  describe("extra availability", () => {
    it("allows a booking outside weekly hours when an override covers it", async () => {
      prismaService.clinic.findUnique.mockResolvedValue({ timezone: "UTC" });
      prismaService.doctorAvailability.count.mockResolvedValue(1);
      prismaService.doctorAvailability.findFirst.mockResolvedValue(null);
      prismaService.doctorAvailabilityOverride.findFirst.mockResolvedValue({
        id: "ov1",
      });
      prismaService.doctorTimeOff.findFirst.mockResolvedValue(null);

      const helpers = () =>
        service as unknown as {
          validateAvailability: (
            clinicId: string,
            doctorId: string,
            scheduledAt: Date,
            durationMins: number,
          ) => Promise<void>;
        };

      await expect(
        helpers().validateAvailability(
          "c1",
          "d1",
          new Date("2026-01-05T18:00:00.000Z"),
          30,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe("Clinic isolation", () => {
    it("should throw if patient does not belong to clinic or does not exist", async () => {
      prismaService.patient.findFirst.mockResolvedValue(null);
      await expect(
        helpers().validateEntities("clinic1", {
          patientId: "p1",
          doctorId: "d1",
        }),
      ).rejects.toThrow("Invalid or inactive patient");
    });
  });

  describe("role scoping", () => {
    it("forces practitioner appointment lists to their own clinic user", async () => {
      repository.findAllByClinic.mockResolvedValue([]);

      await service.findAll(
        "clinic1",
        { doctorId: "another-doctor" },
        Role.practitioner,
        "own-doctor",
      );

      expect(repository.findAllByClinic).toHaveBeenCalledWith("clinic1", {
        doctorId: "own-doctor",
      });
    });

    it("rejects a practitioner list request without an authenticated clinic user", () => {
      expect(() => service.findAll("clinic1", {}, Role.practitioner)).toThrow(
        "Practitioner identity is required",
      );
      expect(repository.findAllByClinic).not.toHaveBeenCalled();
    });

    it("rejects a practitioner reassigning the appointment practitioner", async () => {
      const actor = {
        userId: "u1",
        clinicUserId: "own-doctor",
        clinicId: "c1",
        role: Role.practitioner,
      };
      try {
        await service.update("c1", "u1", "app1", { doctorId: "other-doctor" }, actor);
        throw new Error("expected the update to be rejected");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(403);
        expect((error as HttpException).getResponse()).toMatchObject({
          code: "clinicUnavailable",
        });
      }
      expect(repository.findById).not.toHaveBeenCalled();
    });

    it("lets a practitioner update status without touching the assigned practitioner", async () => {
      repository.findById.mockResolvedValue(null);
      await expect(
        service.update(
          "c1",
          "u1",
          "app1",
          { status: AppointmentStatusDto.confirmed },
          {
            userId: "u1",
            clinicUserId: "own-doctor",
            clinicId: "c1",
            role: Role.practitioner,
          },
        ),
      ).rejects.toThrow("Appointment not found");
      expect(repository.findById).toHaveBeenCalled();
    });
  });

  describe("appointment lifecycle boundaries", () => {
    it("rejects cancellation reasons containing only whitespace", async () => {
      repository.findById.mockResolvedValue({ id: "app1", clinicId: "c1", status: "confirmed" });
      await expect(service.update("c1", "u1", "app1", { status: AppointmentStatusDto.cancelled, cancelReason: "   " })).rejects.toThrow("Cancellation reason is required");
    });
    it("does not reschedule a cancelled appointment", async () => {
      repository.findById.mockResolvedValue({ id: "app1", clinicId: "c1", status: "cancelled" });
      await expect(service.update("c1", "u1", "app1", { scheduledAt: new Date(Date.now() + 86400000).toISOString() })).rejects.toThrow("Cannot update a cancelled appointment");
    });
    it("does not mark a future appointment as no-show", async () => {
      repository.findById.mockResolvedValue({ id: "app1", clinicId: "c1", status: "confirmed", scheduledAt: new Date(Date.now() + 86400000) });
      await expect(service.update("c1", "u1", "app1", { status: AppointmentStatusDto.no_show })).rejects.toThrow("An appointment cannot be marked as a no-show before its scheduled time");
    });
  });

  describe("update status transitions", () => {
    it("should require cancelReason when cancelling", async () => {
      repository.findById.mockResolvedValue({
        id: "app1",
        clinicId: "c1",
        status: "unconfirmed",
      });
      await expect(
        service.update("c1", "u1", "app1", {
          status: AppointmentStatusDto.cancelled,
        }),
      ).rejects.toThrow("Cancellation reason is required");
    });
  });
});
