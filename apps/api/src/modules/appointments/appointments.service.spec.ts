import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';
import { DashboardGateway } from '@/modules/dashboard/dashboard.gateway';
import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentStatusDto } from './dto';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prismaService: any;
  let repository: any;
  let gateway: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: AppointmentsRepository, useValue: repository },
        { provide: DashboardGateway, useValue: gateway },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  describe('Pricing calculation', () => {
    it('should calculate pricing based on service fee', async () => {
      // @ts-ignore
      const result = service.calculatePricing({ fee: 100 });
      expect(result.fee).toBe(100);
      expect(result.discount).toBeUndefined();
    });

    it('should apply fee override if provided', async () => {
      // @ts-ignore
      const result = service.calculatePricing({ fee: 100 }, 150);
      expect(result.fee).toBe(150);
    });

    it('should calculate valid percentage discount', async () => {
      // @ts-ignore
      const result = service.calculatePricing({ fee: 100 }, undefined, 20, 'percentage', 'Staff discount');
      expect(result.discount).toBe(20);
      expect(result.discountType).toBe('percentage');
      expect(result.discountReason).toBe('Staff discount');
    });

    it('should throw error if discount is set without reason', () => {
      expect(() => {
        // @ts-ignore
        service.calculatePricing({ fee: 100 }, undefined, 20, 'percentage');
      }).toThrow(BadRequestException);
    });

    it('should throw error if percentage > 100', () => {
      expect(() => {
        // @ts-ignore
        service.calculatePricing({ fee: 100 }, undefined, 120, 'percentage', 'Promo');
      }).toThrow(BadRequestException);
    });

    it('should throw error if fixed discount > fee', () => {
      expect(() => {
        // @ts-ignore
        service.calculatePricing({ fee: 100 }, undefined, 150, 'fixed', 'Promo');
      }).toThrow(BadRequestException);
    });
  });

  describe('Delivery mode rules', () => {
    it('should throw if service does not support sessionType', () => {
      expect(() => {
        // @ts-ignore
        service.validateSessionType('online', { supportedModes: ['in_person'] });
      }).toThrow(BadRequestException);
    });

    it('should require roomId for in_person', () => {
      expect(() => {
        // @ts-ignore
        service.validateSessionType('in_person', null, undefined, undefined);
      }).toThrow(BadRequestException);
    });

    it('should require meetingUrl for online', () => {
      expect(() => {
        // @ts-ignore
        service.validateSessionType('online', null, undefined, undefined);
      }).toThrow(BadRequestException);
    });

    it('should require HTTPS for meetingUrl', () => {
      expect(() => {
        // @ts-ignore
        service.validateSessionType('online', null, undefined, 'http://example.com');
      }).toThrow(BadRequestException);
    });

    it('should pass for valid in_person', () => {
      // @ts-ignore
      expect(() => service.validateSessionType('in_person', null, 'room123', undefined)).not.toThrow();
    });

    it('should pass for valid online', () => {
      // @ts-ignore
      expect(() => service.validateSessionType('online', null, undefined, 'https://example.com')).not.toThrow();
    });
  });

  describe('Clinic isolation', () => {
    it('should throw if patient does not belong to clinic or does not exist', async () => {
      prismaService.patient.findFirst.mockResolvedValue(null);
      await expect(
        // @ts-ignore
        service.validateEntities('clinic1', { patientId: 'p1', doctorId: 'd1' })
      ).rejects.toThrow('Invalid or inactive patient');
    });
  });

  describe('update status transitions', () => {
    it('should require cancelReason when cancelling', async () => {
      repository.findById.mockResolvedValue({ id: 'app1', clinicId: 'c1', status: 'unconfirmed' });
      await expect(
        // @ts-ignore
        service.update('c1', 'u1', 'app1', { status: AppointmentStatusDto.cancelled })
      ).rejects.toThrow('Cancellation reason is required');
    });
  });
});
