import { visitError } from "@/modules/visits/visit-errors";
import { ConflictException, Injectable } from "@nestjs/common";
import { AppointmentStatus, Prisma, Role } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import {
  AvailabilitySlotDto,
  AvailabilityOverrideEntryDto,
  CreatePractitionerDto,
  TimeOffEntryDto,
  UpdatePractitionerDto,
  SelfProfileDto,
} from "./dto";
import { initialsFromName } from "./practitioners.mapper";

const NON_BILLABLE: AppointmentStatus[] = [
  AppointmentStatus.cancelled,
  AppointmentStatus.no_show,
];

const include = {
  user: { select: { email: true } },
  department: { select: { id: true, name: true, nameAr: true } },
  defaultRoom: { select: { id: true, name: true, nameAr: true } },
  services: {
    include: {
      service: {
        select: {
          id: true,
          name: true,
          nameAr: true,
          durationMins: true,
          fee: true,
        },
      },
    },
  },
  availabilities: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
  timeOffs: { orderBy: { startDate: "asc" } },
  availabilityOverrides: { orderBy: { startAt: "asc" } },
} satisfies Prisma.ClinicUserInclude;

@Injectable()
export class PractitionersRepository {
  constructor(private prisma: PrismaService) {}

  async scheduleRequests(
    clinicId: string,
    filters: { doctorId?: string; departmentId?: string; group: 'all' | 'pending' | 'history'; sort: 'newest' | 'oldest'; page: number; kind?: 'leave' | 'vacation' | 'extra'; search?: string },
  ) {
    const { doctorId, departmentId, group, sort, page } = filters;
    const search = filters.search?.trim();
    const where: Prisma.PractitionerScheduleRequestWhereInput = {
      clinicId,
      ...(filters.kind ? { kind: filters.kind } : {}),
      ...(search ? { OR: [
        { reason: { contains: search, mode: 'insensitive' } },
        { doctor: { name: { contains: search, mode: 'insensitive' } } },
        { doctor: { nameAr: { contains: search, mode: 'insensitive' } } },
      ] } : {}),
      ...(doctorId ? { doctorId } : {}),
      ...(departmentId ? { doctor: { departmentId } } : {}),
      ...(group === 'all' ? {} : { status: group === 'pending' ? 'pending' : { not: 'pending' } }),
    };
    const pageSize = 20;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.practitionerScheduleRequest.findMany({ where, include: { doctor: { select: { name: true, nameAr: true, imageUrl: true } } }, orderBy: [{ createdAt: sort === 'oldest' ? 'asc' : 'desc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.practitionerScheduleRequest.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  scheduleReviewers(tx: Prisma.TransactionClient, clinicId: string) {
    return tx.clinicUser.findMany({ where: { clinicId, isActive: true, role: { in: [Role.owner, Role.admin] } }, select: { id: true } });
  }

  scheduleWrite<T>(clinicId: string, operation: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${clinicId}, 0))`;
      return operation(tx);
    });
  }

  async assertLeaveAvailable(tx: Prisma.TransactionClient, clinicId: string, doctorId: string, startAt: Date, endAt: Date) {
    const appointments = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Appointment" WHERE "clinicId" = ${clinicId} AND "doctorId" = ${doctorId}
        AND "status" NOT IN ('cancelled', 'no_show', 'completed') AND "scheduledAt" < ${endAt}
        AND "scheduledAt" + "durationMins" * interval '1 minute' > ${startAt} LIMIT 1`;
    if (appointments.length) throw new ConflictException({ code: "scheduleRequestAppointments", message: "Reschedule or cancel conflicting appointments before approving leave" });
  }

  private async lockSchedule(tx: Prisma.TransactionClient, doctorId: string) {
    const doctor = await tx.clinicUser.findUniqueOrThrow({ where: { id: doctorId }, select: { clinicId: true } });
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${doctor.clinicId}, 0))`;
    return doctor.clinicId;
  }

  emailExists(email: string) {
    return this.prisma.user.findUnique({ where: { email } }).then(Boolean);
  }

  departmentInClinic(id: string, clinicId: string) {
    return this.prisma.department
      .findFirst({ where: { id, clinicId }, select: { id: true } })
      .then(Boolean);
  }

  roomInClinic(id: string, clinicId: string) {
    return this.prisma.room
      .findFirst({ where: { id, clinicId }, select: { id: true } })
      .then(Boolean);
  }

  countServicesInClinic(ids: string[], clinicId: string) {
    return this.prisma.service.count({ where: { clinicId, id: { in: ids } } });
  }

  findAllByClinic(clinicId: string) {
    return this.prisma.clinicUser.findMany({
      where: { clinicId, role: Role.practitioner },
      include,
      orderBy: { name: "asc" },
    });
  }

  findById(id: string, clinicId: string) {
    return this.prisma.clinicUser.findFirst({
      where: {
        id,
        role: Role.practitioner,
        clinicId,
      },
      include,
    });
  }

  createWithUser(params: {
    dto: CreatePractitionerDto;
    passwordHash: string;
    initials: string;
  }) {
    const { dto, passwordHash, initials } = params;
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.trim().toLowerCase(),
          passwordHash,
          mustChangePassword: true,
        },
      });

      const clinicUser = await tx.clinicUser.create({
        data: {
          userId: user.id,
          clinicId: dto.clinicId,
          role: Role.practitioner,
          name: dto.name.trim(),
          nameAr: dto.nameAr?.trim() || null,
          title: dto.title?.trim() || null,
          phone: dto.phone?.trim() || null,
          whatsapp: dto.whatsapp?.trim() || null,
          nationality: dto.nationality?.trim().toUpperCase() || null,
          specialty: dto.specialty?.trim() || null,
          specialtyAr: dto.specialtyAr?.trim() || null,
          languages: dto.languages ?? [],
          initials,
          dob: dto.dob ? new Date(dto.dob) : null,
          gender: dto.gender?.trim() || null,
          bio: dto.bio?.trim() || null,
          bioAr: dto.bioAr?.trim() || null,
          experienceYears: dto.experienceYears ?? null,
          imageUrl: dto.imageUrl?.trim() || null,
          licenseNumber: dto.licenseNumber?.trim() || null,
          licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : null,
          departmentId: dto.departmentId,
          defaultRoomId: dto.defaultRoomId || null,
          employmentType: dto.employmentType ?? null,
          commissionPercent:
            dto.commissionPercent === undefined ||
            dto.commissionPercent === null
              ? null
              : dto.commissionPercent,
          bufferMins: dto.bufferMins ?? 0,
        },
      });

      await this.syncChildren(tx, clinicUser.id, dto);
      return tx.clinicUser.findFirstOrThrow({
        where: { id: clinicUser.id },
        include,
      });
    });
  }

  updateProfile(
    id: string,
    dto: UpdatePractitionerDto,
    data: Prisma.ClinicUserUpdateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.clinicUser.update({ where: { id }, data });
      await this.syncChildren(tx, id, dto);
      return tx.clinicUser.findFirstOrThrow({ where: { id }, include });
    });
  }

  updateSelfProfile(id: string, dto: SelfProfileDto) {
    return this.prisma.clinicUser.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        nameAr: dto.nameAr?.trim() || null,
        phone: dto.phone?.trim() || null,
        whatsapp: dto.whatsapp?.trim() || null,
        bio: dto.bio?.trim() || null,
        bioAr: dto.bioAr?.trim() || null,
        initials: dto.name ? initialsFromName(dto.name) : undefined,
      },
      include,
    });
  }

  async replaceServices(id: string, serviceIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await this.setServices(tx, id, serviceIds);
      return tx.clinicUser.findFirstOrThrow({ where: { id }, include });
    });
  }

  async replaceAvailability(id: string, slots: AvailabilitySlotDto[]) {
    return this.prisma.$transaction(async (tx) => {
      await this.setAvailability(tx, id, slots);
      return tx.clinicUser.findFirstOrThrow({ where: { id }, include });
    });
  }

  async replaceTimeOff(id: string, entries: TimeOffEntryDto[]) {
    return this.prisma.$transaction(async (tx) => {
      await this.setTimeOff(tx, id, entries);
      return tx.clinicUser.findFirstOrThrow({ where: { id }, include });
    });
  }

  deactivate(id: string) {
    return this.prisma.clinicUser.update({
      where: { id },
      data: { isActive: false },
      include,
    });
  }

  reactivate(id: string) {
    return this.prisma.clinicUser.update({
      where: { id },
      data: { isActive: true },
      include,
    });
  }

  hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      if (await tx.visit.count({ where: { appointment: { doctorId: id } } })) visitError("visitRecordRetained", 409);
      const appointments = await tx.appointment.findMany({
        where: { doctorId: id },
        select: {
          id: true,
          status: true,
          patientPackageId: true,
          packageCredit: true,
        },
      });
      const appointmentIds = appointments.map((row) => row.id);

      await this.preservePackageUsage(
        tx,
        appointments.filter(
          (row) => row.patientPackageId && !NON_BILLABLE.includes(row.status),
        ),
      );

      await tx.referral.deleteMany({
        where: {
          OR: [
            { fromDoctorId: id },
            { toDoctorId: id },
            ...(appointmentIds.length
              ? [{ appointmentId: { in: appointmentIds } }]
              : []),
          ],
        },
      });

      await tx.appointment.updateMany({
        where: { paidById: id },
        data: { paidById: null },
      });

      await tx.patient.updateMany({
        where: { primaryDoctorId: id },
        data: { primaryDoctorId: null },
      });

      await tx.appointment.deleteMany({ where: { doctorId: id } });
      await tx.doctorAvailability.deleteMany({ where: { doctorId: id } });
      await tx.doctorTimeOff.deleteMany({ where: { doctorId: id } });
      await tx.doctorAvailabilityOverride.deleteMany({
        where: { doctorId: id },
      });
      await tx.clinicUserService.deleteMany({ where: { clinicUserId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });

      const row = await tx.clinicUser.delete({ where: { id } });
      const remaining = await tx.clinicUser.count({
        where: { userId: row.userId },
      });
      if (remaining === 0) {
        await tx.user.delete({ where: { id: row.userId } });
      }

      return row;
    });
  }

  private async preservePackageUsage(
    tx: Prisma.TransactionClient,
    redeemed: Array<{
      patientPackageId: string | null;
      packageCredit: Prisma.Decimal | null;
    }>,
  ) {
    const byEnrollment = new Map<
      string,
      { sessions: number; credit: Prisma.Decimal }
    >();

    for (const row of redeemed) {
      const enrollmentId = row.patientPackageId;
      if (!enrollmentId) continue;
      const bucket = byEnrollment.get(enrollmentId) ?? {
        sessions: 0,
        credit: new Prisma.Decimal(0),
      };
      if (row.packageCredit == null) {
        bucket.sessions += 1;
      } else {
        bucket.credit = bucket.credit.plus(row.packageCredit);
      }
      byEnrollment.set(enrollmentId, bucket);
    }

    for (const [enrollmentId, used] of byEnrollment) {
      const enrollment = await tx.patientPackage.findUnique({
        where: { id: enrollmentId },
        select: { sessionsTotal: true, creditTotal: true },
      });
      if (!enrollment) continue;

      if (enrollment.sessionsTotal != null && used.sessions > 0) {
        await tx.patientPackage.update({
          where: { id: enrollmentId },
          data: {
            sessionsTotal: Math.max(
              0,
              enrollment.sessionsTotal - used.sessions,
            ),
          },
        });
      }

      if (enrollment.creditTotal != null && used.credit.greaterThan(0)) {
        await tx.patientPackage.update({
          where: { id: enrollmentId },
          data: {
            creditTotal: Prisma.Decimal.max(
              enrollment.creditTotal.minus(used.credit),
              new Prisma.Decimal(0),
            ),
          },
        });
      }
    }
  }

  private async syncChildren(
    tx: Prisma.TransactionClient,
    doctorId: string,
    dto: {
      serviceIds?: string[];
      availabilities?: AvailabilitySlotDto[];
      timeOffs?: TimeOffEntryDto[];
      availabilityOverrides?: AvailabilityOverrideEntryDto[];
    },
  ) {
    if (dto.serviceIds) await this.setServices(tx, doctorId, dto.serviceIds);
    if (dto.availabilities)
      await this.setAvailability(tx, doctorId, dto.availabilities);
    if (dto.timeOffs) await this.setTimeOff(tx, doctorId, dto.timeOffs);
    if (dto.availabilityOverrides) {
      await this.setAvailabilityOverrides(
        tx,
        doctorId,
        dto.availabilityOverrides,
      );
    }
  }

  private async setServices(
    tx: Prisma.TransactionClient,
    clinicUserId: string,
    serviceIds: string[],
  ) {
    await tx.clinicUserService.deleteMany({ where: { clinicUserId } });
    if (!serviceIds.length) return;
    await tx.clinicUserService.createMany({
      data: serviceIds.map((serviceId) => ({ clinicUserId, serviceId })),
    });
  }

  private async setAvailability(
    tx: Prisma.TransactionClient,
    doctorId: string,
    slots: AvailabilitySlotDto[],
  ) {
    await tx.doctorAvailability.deleteMany({ where: { doctorId } });
    if (!slots.length) return;
    await tx.doctorAvailability.createMany({
      data: slots.map((slot) => ({
        doctorId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        effectiveFrom: slot.effectiveFrom ? new Date(slot.effectiveFrom) : null,
        effectiveUntil: slot.effectiveUntil
          ? new Date(slot.effectiveUntil)
          : null,
        isActive: slot.isActive !== false,
      })),
    });
  }

  private async setTimeOff(
    tx: Prisma.TransactionClient,
    doctorId: string,
    entries: TimeOffEntryDto[],
  ) {
    const clinicId = await this.lockSchedule(tx, doctorId);
    for (const entry of entries) {
      const startAt = new Date(entry.startDate);
      const endAt = new Date(entry.endDate);
      const existing = await tx.doctorTimeOff.findFirst({ where: { doctorId, startDate: startAt, endDate: endAt }, select: { id: true } });
      if (!existing) await this.assertLeaveAvailable(tx, clinicId, doctorId, startAt, endAt);
    }
    const existingEntries = await tx.doctorTimeOff.findMany({
      where: { doctorId },
      select: { startDate: true, endDate: true, kind: true },
    });
    await tx.doctorTimeOff.deleteMany({ where: { doctorId } });
    if (!entries.length) return;
    await tx.doctorTimeOff.createMany({
      data: entries.map((entry) => ({
        doctorId,
        startDate: new Date(entry.startDate),
        endDate: new Date(entry.endDate),
        reason: entry.reason?.trim() || null,
        kind: entry.kind ?? existingEntries.find(
          (current) => current.startDate.getTime() === new Date(entry.startDate).getTime() && current.endDate.getTime() === new Date(entry.endDate).getTime(),
        )?.kind ?? "leave",
      })),
    });
  }

  private async setAvailabilityOverrides(
    tx: Prisma.TransactionClient,
    doctorId: string,
    entries: AvailabilityOverrideEntryDto[],
  ) {
    await this.lockSchedule(tx, doctorId);
    await tx.doctorAvailabilityOverride.deleteMany({ where: { doctorId } });
    if (!entries.length) return;
    await tx.doctorAvailabilityOverride.createMany({
      data: entries.map((entry) => ({
        doctorId,
        startAt: new Date(entry.startAt),
        endAt: new Date(entry.endAt),
        reason: entry.reason?.trim() || null,
      })),
    });
  }
}
