import { Injectable } from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import {
  AvailabilitySlotDto,
  CreatePractitionerDto,
  TimeOffEntryDto,
  UpdatePractitionerDto,
} from "./dto";

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
          initials,
          dob: dto.dob ? new Date(dto.dob) : null,
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
          calendarColor: dto.calendarColor ?? null,
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
