import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { AppointmentStatus, type Room, type Service } from "@prisma/client";
import { AppointmentsRepository } from "./appointments.repository";
import { DashboardGateway } from "@/modules/dashboard/dashboard.gateway";
import { PrismaService } from "@/prisma/prisma.service";
import { DiscountCodesService } from "@/modules/discount-codes/discount-codes.service";
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentFiltersDto,
  AppointmentStatusDto,
  MarkPaidDto,
  SessionTypeDto,
  DiscountTypeDto,
} from "./dto";

type ValidateEntitiesInput = {
  patientId: string;
  doctorId: string;
  serviceId?: string | null;
  departmentId?: string | null;
  roomId?: string | null;
};

@Injectable()
export class AppointmentsService {
  constructor(
    private appointmentsRepository: AppointmentsRepository,
    private dashboardGateway: DashboardGateway,
    private prisma: PrismaService,
    private discountCodesService: DiscountCodesService,
  ) {}

  private async resolveDiscountCode(
    clinicId: string,
    discountCodeId: string | null | undefined,
    discount?: number,
    discountType?: string,
    discountReason?: string,
  ) {
    if (!discountCodeId) {
      return {
        discount,
        discountType,
        discountReason,
        discountCodeId: undefined as string | undefined,
      };
    }

    const row = await this.prisma.discountCode.findFirst({
      where: { id: discountCodeId, clinicId },
    });
    if (!row) throw new BadRequestException("Invalid discount code");

    await this.discountCodesService.validate({
      clinicId,
      code: row.code,
    });

    return {
      discount: discount ?? Number(row.discountValue),
      discountType: discountType ?? row.discountType,
      discountReason: discountReason?.trim() || `Code: ${row.code}`,
      discountCodeId: row.id,
    };
  }

  private async validateEntities(clinicId: string, dto: ValidateEntitiesInput) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, clinicId, isActive: true },
    });
    if (!patient) throw new BadRequestException("Invalid or inactive patient");

    const doctor = await this.prisma.clinicUser.findFirst({
      where: { id: dto.doctorId, clinicId, isActive: true },
    });
    if (!doctor) throw new BadRequestException("Invalid or inactive doctor");

    let service: Service | null = null;
    if (dto.serviceId) {
      service = await this.prisma.service.findFirst({
        where: { id: dto.serviceId, clinicId, isActive: true },
      });
      if (!service)
        throw new BadRequestException("Invalid or inactive service");
    }

    if (dto.departmentId) {
      const dept = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, clinicId, isActive: true },
      });
      if (!dept)
        throw new BadRequestException("Invalid or inactive department");
    }

    let room: Room | null = null;
    if (dto.roomId) {
      room = await this.prisma.room.findFirst({
        where: { id: dto.roomId, clinicId, isActive: true },
      });
      if (!room) throw new BadRequestException("Invalid or inactive room");
    }

    return { patient, doctor, service, room };
  }

  private validateSessionType(
    sessionType: string,
    service: Pick<Service, "supportedModes"> | null | undefined,
    roomId?: string,
    meetingUrl?: string,
  ) {
    if (
      service?.supportedModes &&
      !(service.supportedModes as string[]).includes(sessionType)
    ) {
      throw new BadRequestException(
        `Service does not support ${sessionType} mode`,
      );
    }

    if (sessionType === "in_person") {
      if (!roomId)
        throw new BadRequestException(
          "Room is required for in-person appointments",
        );
      if (meetingUrl)
        throw new BadRequestException(
          "Meeting URL cannot be set for in-person appointments",
        );
    } else if (sessionType === "online") {
      if (roomId)
        throw new BadRequestException(
          "Room cannot be set for online appointments",
        );
      if (!meetingUrl)
        throw new BadRequestException(
          "Meeting URL is required for online appointments",
        );
      if (!meetingUrl.startsWith("https://"))
        throw new BadRequestException("Meeting URL must be HTTPS");
    }
  }

  private calculatePricing(
    service: Pick<Service, "fee"> | null | undefined,
    feeOverride?: number,
    discount?: number,
    discountType?: DiscountTypeDto | string,
    discountReason?: string,
  ) {
    const fee = feeOverride ?? (service ? Number(service.fee) : 0);

    if (discount !== undefined && discount !== null) {
      if (!discountType)
        throw new BadRequestException(
          "Discount type is required when discount is provided",
        );

      if (discount > 0 && (!discountReason || !discountReason.trim())) {
        throw new BadRequestException(
          "Discount reason is required when a discount is applied",
        );
      }

      if (discountType === "percentage" && discount > 100) {
        throw new BadRequestException("Percentage discount cannot exceed 100%");
      }
      if (discountType === "fixed" && discount > fee) {
        throw new BadRequestException("Fixed discount cannot exceed the fee");
      }
    } else if (discountType) {
      throw new BadRequestException(
        "Discount value is required when discount type is provided",
      );
    }

    return {
      fee,
      discount,
      discountType: discountType as DiscountTypeDto | undefined,
      discountReason,
    };
  }

  private async validateAvailability(
    clinicId: string,
    doctorId: string,
    scheduledAt: Date,
    durationMins: number,
  ) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });
    const timezone = clinic?.timezone || "UTC";

    // A doctor with no configured weekly schedule hasn't opted into availability
    // enforcement yet — don't block every booking because of missing setup.
    const hasSchedule = await this.prisma.doctorAvailability.count({
      where: { doctorId, isActive: true },
    });

    if (hasSchedule > 0) {
      const clinicLocalStr = scheduledAt.toLocaleString("en-US", {
        timeZone: timezone,
        hour12: false,
      });
      const clinicLocalTime = new Date(clinicLocalStr);

      const dayOfWeek = clinicLocalTime.getDay();
      const h = clinicLocalTime.getHours().toString().padStart(2, "0");
      const m = clinicLocalTime.getMinutes().toString().padStart(2, "0");
      const startTimeStr = `${h}:${m}`;

      const endAt = new Date(scheduledAt.getTime() + durationMins * 60000);
      const endLocalStr = endAt.toLocaleString("en-US", {
        timeZone: timezone,
        hour12: false,
      });
      const endLocalTime = new Date(endLocalStr);
      const eh = endLocalTime.getHours().toString().padStart(2, "0");
      const em = endLocalTime.getMinutes().toString().padStart(2, "0");
      const endTimeStr = `${eh}:${em}`;

      const avail = await this.prisma.doctorAvailability.findFirst({
        where: {
          doctorId,
          dayOfWeek,
          isActive: true,
          startTime: { lte: startTimeStr },
          endTime: { gte: endTimeStr },
        },
      });

      if (!avail) {
        throw new BadRequestException("Doctor is not available at this time");
      }
    }

    const endAt = new Date(scheduledAt.getTime() + durationMins * 60000);
    const timeOff = await this.prisma.doctorTimeOff.findFirst({
      where: {
        doctorId,
        startDate: { lte: endAt },
        endDate: { gte: scheduledAt },
      },
    });

    if (timeOff) {
      throw new BadRequestException("Doctor is on time off during this period");
    }
  }

  private async checkConflicts(
    clinicId: string,
    doctorId: string,
    roomId: string | null | undefined,
    scheduledAt: Date,
    durationMins: number,
    excludeId?: string,
  ) {
    if (roomId) {
      const roomConflict = await this.appointmentsRepository.findConflict(
        clinicId,
        roomId,
        scheduledAt,
        durationMins,
        excludeId,
      );
      if (roomConflict)
        throw new ConflictException("Room is already booked at this time");
    }

    const docConflict = await this.appointmentsRepository.findDoctorConflict(
      clinicId,
      doctorId,
      scheduledAt,
      durationMins,
      excludeId,
    );
    if (docConflict)
      throw new ConflictException(
        "Doctor already has an appointment at this time",
      );
  }

  async create(clinicId: string, userId: string, dto: CreateAppointmentDto) {
    const { service } = await this.validateEntities(clinicId, dto);
    const sessionType = dto.sessionType ?? SessionTypeDto.in_person;
    const durationMins =
      dto.durationMins ?? (service ? service.durationMins : 45);
    const scheduledAt = new Date(dto.scheduledAt);

    this.validateSessionType(
      sessionType,
      service,
      dto.roomId ?? undefined,
      dto.meetingUrl ?? undefined,
    );

    const codeFields = await this.resolveDiscountCode(
      clinicId,
      dto.discountCodeId,
      dto.discount,
      dto.discountType,
      dto.discountReason,
    );

    const pricing = this.calculatePricing(
      service,
      dto.feeOverride,
      codeFields.discount,
      codeFields.discountType,
      codeFields.discountReason,
    );

    await this.validateAvailability(
      clinicId,
      dto.doctorId,
      scheduledAt,
      durationMins,
    );
    await this.checkConflicts(
      clinicId,
      dto.doctorId,
      dto.roomId,
      scheduledAt,
      durationMins,
    );

    const appointment = await this.appointmentsRepository.create(clinicId, {
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      departmentId: dto.departmentId,
      roomId: dto.roomId,
      serviceId: dto.serviceId,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
      meetingUrl: dto.meetingUrl,
      sessionType,
      durationMins,
      fee: pricing.fee,
      discount: pricing.discount,
      discountType: pricing.discountType,
      discountReason: pricing.discountReason,
      discountCodeId: codeFields.discountCodeId,
    });

    if (codeFields.discountCodeId) {
      await this.discountCodesService.consume(codeFields.discountCodeId);
    }

    this.dashboardGateway.emitAppointmentChanged(clinicId);
    return appointment;
  }

  findAll(clinicId: string, filters: AppointmentFiltersDto) {
    return this.appointmentsRepository.findAllByClinic(clinicId, filters);
  }

  async findOne(clinicId: string, id: string) {
    const appointment = await this.appointmentsRepository.findById(
      clinicId,
      id,
    );
    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }
    return appointment;
  }

  async update(
    clinicId: string,
    userId: string,
    id: string,
    dto: UpdateAppointmentDto,
  ) {
    const existing = await this.findOne(clinicId, id);

    // Status transitions
    if (dto.status && String(dto.status) !== String(existing.status)) {
      if (dto.status === AppointmentStatusDto.cancelled && !dto.cancelReason) {
        throw new BadRequestException("Cancellation reason is required");
      }
      if (existing.status === AppointmentStatus.cancelled) {
        throw new BadRequestException("Cannot update a cancelled appointment");
      }
    }

    const doctorId = dto.doctorId ?? existing.doctorId;
    const roomId = dto.roomId !== undefined ? dto.roomId : existing.roomId;
    const sessionType = dto.sessionType ?? existing.sessionType;
    const serviceId =
      dto.serviceId !== undefined ? dto.serviceId : existing.serviceId;
    const durationMins = dto.durationMins ?? existing.durationMins;
    const scheduledAt = dto.scheduledAt
      ? new Date(dto.scheduledAt)
      : existing.scheduledAt;
    const meetingUrl =
      dto.meetingUrl !== undefined ? dto.meetingUrl : existing.meetingUrl;

    // Validate entities if changed
    let service = existing.service;
    if (dto.doctorId || dto.serviceId || dto.roomId || dto.departmentId) {
      const validationDto: ValidateEntitiesInput = {
        patientId: existing.patientId,
        doctorId,
        serviceId,
        roomId,
        departmentId: dto.departmentId ?? existing.departmentId,
      };
      const entities = await this.validateEntities(clinicId, validationDto);
      service = entities.service;
    }

    this.validateSessionType(
      sessionType,
      service,
      roomId ?? undefined,
      meetingUrl ?? undefined,
    );

    if (dto.scheduledAt || dto.durationMins || dto.doctorId || dto.roomId) {
      await this.validateAvailability(
        clinicId,
        doctorId,
        scheduledAt,
        durationMins,
      );
      await this.checkConflicts(
        clinicId,
        doctorId,
        roomId,
        scheduledAt,
        durationMins,
        id,
      );
    }

    const pricing = this.calculatePricing(
      service,
      dto.feeOverride !== undefined ? dto.feeOverride : undefined,
      dto.discount !== undefined
        ? dto.discount
        : existing.discount
          ? Number(existing.discount)
          : undefined,
      dto.discountType !== undefined
        ? dto.discountType
        : (existing.discountType ?? undefined),
      dto.discountReason !== undefined
        ? dto.discountReason
        : (existing.discountReason ?? undefined),
    );

    // If feeOverride wasn't specifically provided, and service changed, pricing.fee gets new service fee.
    // If service didn't change, pricing.fee gets existing fee.
    let finalFee = pricing.fee;
    if (dto.feeOverride === undefined && !dto.serviceId) {
      finalFee = existing.fee ? Number(existing.fee) : finalFee;
    }

    const updateData: UpdateAppointmentDto & {
      fee?: number;
      discount?: number;
      discountType?: DiscountTypeDto;
      discountReason?: string;
      statusUpdatedBy?: string;
      statusUpdatedAt?: Date;
    } = {
      doctorId: dto.doctorId,
      departmentId: dto.departmentId,
      roomId: dto.roomId,
      serviceId: dto.serviceId,
      scheduledAt: dto.scheduledAt,
      durationMins: dto.durationMins,
      sessionType: dto.sessionType,
      status: dto.status,
      cancelReason: dto.cancelReason,
      notes: dto.notes,
      discountCodeId: dto.discountCodeId,
      meetingUrl: dto.meetingUrl,
      statusReason: dto.statusReason,
      fee: finalFee,
      discount: pricing.discount,
      discountType: pricing.discountType,
      discountReason: pricing.discountReason,
    };

    if (dto.status && String(dto.status) !== String(existing.status)) {
      updateData.statusUpdatedBy = userId;
      updateData.statusUpdatedAt = new Date();
    }

    const appointment = await this.appointmentsRepository.update(
      clinicId,
      id,
      updateData,
    );
    this.dashboardGateway.emitAppointmentChanged(clinicId);
    return appointment;
  }

  async markPaid(
    clinicId: string,
    clinicUserId: string,
    id: string,
    dto: MarkPaidDto,
  ) {
    await this.findOne(clinicId, id);

    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id: dto.paymentMethodId, clinicId, isActive: true },
    });
    if (!paymentMethod) {
      throw new BadRequestException("Invalid or inactive payment method");
    }

    const appointment = await this.appointmentsRepository.markPaid(
      clinicId,
      id,
      {
        isPaid: true,
        paidAt: new Date(),
        paidById: clinicUserId,
        paymentMethodId: paymentMethod.id,
      },
    );

    this.dashboardGateway.emitAppointmentChanged(clinicId);
    return appointment;
  }

  async markUnpaid(clinicId: string, id: string) {
    await this.findOne(clinicId, id);

    const appointment = await this.appointmentsRepository.markUnpaid(
      clinicId,
      id,
    );
    this.dashboardGateway.emitAppointmentChanged(clinicId);
    return appointment;
  }
}
