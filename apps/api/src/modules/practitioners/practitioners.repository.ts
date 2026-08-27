import { Injectable } from "@nestjs/common";
import { AppointmentStatus, Prisma, Role } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import {
  AvailabilitySlotDto,
  CreatePractitionerDto,
  TimeOffEntryDto,
  UpdatePractitionerDto,
} from "./dto";

const NON_BILLABLE: AppointmentStatus[] = [
  AppointmentStatus.cancelled,
  AppointmentStatus.no_show,
];

const include = {
  user: { select: { email: true } },
  department: { select: { id: true, name: true } },
  defaultRoom: { select: { id: true, name: true } },
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
} satisfies Prisma.ClinicUserInclude;

@Injectable()
export class PractitionersRepository {
  constructor(private prisma: PrismaService) {}

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

  findById(id: string) {
    return this.prisma.clinicUser.findFirst({
      where: { id, role: Role.practitioner },
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
          licenseExpiry: dto.licenseExpiry
            ? new Date(dto.licenseExpiry)
            : null,
          departmentId: dto.departmentId,
          defaultRoomId: dto.defaultRoomId || null,
          employmentType: dto.employmentType ?? null,
          commissionPercent:
            dto.commissionPercent === undefined || dto.commissionPercent === null
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
          (row) =>
            row.patientPackageId &&
            !NON_BILLABLE.includes(row.status),
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
            sessionsTotal: Math.max(0, enrollment.sessionsTotal - used.sessions),
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
    dto: { serviceIds?: string[]; availabilities?: AvailabilitySlotDto[]; timeOffs?: TimeOffEntryDto[] },
  ) {
    if (dto.serviceIds) await this.setServices(tx, doctorId, dto.serviceIds);
    if (dto.availabilities) await this.setAvailability(tx, doctorId, dto.availabilities);
    if (dto.timeOffs) await this.setTimeOff(tx, doctorId, dto.timeOffs);
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
        isActive: slot.isActive !== false,
      })),
    });
  }

  private async setTimeOff(
    tx: Prisma.TransactionClient,
    doctorId: string,
    entries: TimeOffEntryDto[],
  ) {
    await tx.doctorTimeOff.deleteMany({ where: { doctorId } });
    if (!entries.length) return;
    await tx.doctorTimeOff.createMany({
      data: entries.map((entry) => ({
        doctorId,
        startDate: new Date(entry.startDate),
        endDate: new Date(entry.endDate),
        reason: entry.reason?.trim() || null,
      })),
    });
  }
}
