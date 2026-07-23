import { Test, TestingModule } from "@nestjs/testing";
import { AppointmentsService } from "./appointments.service";
import { AppointmentsRepository } from "./appointments.repository";
import { DashboardGateway } from "@/modules/dashboard/dashboard.gateway";
import { PrismaService } from "@/prisma/prisma.service";
import { DiscountCodesService } from "@/modules/discount-codes/discount-codes.service";
import { BadRequestException } from "@nestjs/common";
import { AppointmentStatusDto } from "./dto";
import type { SessionType } from "@prisma/client";

type MockFn = jest.Mock;

type PrismaServiceMock = {
  patient: { findFirst: MockFn };
  clinicUser: { findFirst: MockFn };
  service: { findFirst: MockFn };
  department: { findFirst: MockFn };
  room: { findFirst: MockFn };
  doctorAvailability: { findFirst: MockFn; count: MockFn };
  doctorTimeOff: { findFirst: MockFn };
  clinic: { findUnique: MockFn };
  discountCode: { findFirst: MockFn };
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
      doctorTimeOff: { findFirst: jest.fn() },
      clinic: { findUnique: jest.fn() },
      discountCode: { findFirst: jest.fn() },
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
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  // Private methods are exercised via a narrow cast for unit coverage.
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
