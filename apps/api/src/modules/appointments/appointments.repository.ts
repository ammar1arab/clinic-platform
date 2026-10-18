import {
  Injectable,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma, type Appointment } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentFiltersDto,
  DiscountTypeDto,
  SessionTypeDto,
} from "./dto";

const appointmentInclude = {
  patient: true,
  doctor: true,
  room: true,
  service: true,
  paymentMethodRef: { select: { id: true, name: true } },
} as const;

const nextRevision = (updatedAt: Date) =>
  new Date(Math.max(Date.now(), updatedAt.getTime() + 1));

export type PackageRedemption = {
  patientPackageId: string | null;
  packageCredit: number | null;
  isPaid: boolean;
  paidAt: Date | null;
  paidById: string | null;
  paymentMethodId: string | null;
  paymentMethod: string | null;
};

@Injectable()
export class AppointmentsRepository {
  constructor(private prisma: PrismaService) {}

  private write<T>(
    clinicId: string,
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${clinicId}, 0))`;
      return operation(tx);
    });
  }

  private async current(
    tx: Prisma.TransactionClient,
    clinicId: string,
    id: string,
    expectedUpdatedAt?: Date,
  ) {
    const current = await tx.appointment.findUniqueOrThrow({
      where: { id, clinicId },
    });
    if (
      expectedUpdatedAt &&
      current.updatedAt.getTime() !== expectedUpdatedAt.getTime()
    )
      throw new ConflictException({
        code: "appointmentChanged",
        message: "appointmentChanged",
      });
    return current;
  }

  private async assertNoConflict(
    tx: Prisma.TransactionClient,
    clinicId: string,
    doctorId: string,
    roomId: string | null | undefined,
    scheduledAt: Date,
    durationMins: number,
    excludeId?: string,
  ) {
    if (
      roomId &&
      (await this.findConflict(
        clinicId,
        { roomId },
        scheduledAt,
        durationMins,
        excludeId,
        tx,
      ))
    ) {
      throw new ConflictException("Room is already booked at this time");
    }
    if (
      await this.findConflict(
        clinicId,
        { doctorId },
        scheduledAt,
        durationMins,
        excludeId,
        tx,
      )
    ) {
      throw new ConflictException(
        "Doctor already has an appointment at this time",
      );
    }
  }

  private async consumeDiscountCode(
    tx: Prisma.TransactionClient,
    clinicId: string,
    id: string,
  ) {
    const changed = await tx.discountCode.updateMany({
      where: {
        id,
        clinicId,
        isActive: true,
        OR: [
          { maxUses: null },
          { usedCount: { lt: tx.discountCode.fields.maxUses } },
        ],
      },
      data: { usedCount: { increment: 1 } },
    });
    if (!changed.count)
      throw new BadRequestException("Promocode has reached its usage limit");
  }

  create(
    clinicId: string,
    dto: Omit<CreateAppointmentDto, "feeOverride" | "discountCodeId"> & {
      fee?: number;
      discount?: number;
      discountType?: DiscountTypeDto | string;
      durationMins: number;
      sessionType: SessionTypeDto | string;
      discountCodeId?: string;
      meetingUrl?: string;
    },
  ) {
    return this.write(clinicId, async (tx) => {
      await this.assertNoConflict(
        tx,
        clinicId,
        dto.doctorId,
        dto.roomId,
        new Date(dto.scheduledAt),
        dto.durationMins,
      );
      if (dto.discountCodeId)
        await this.consumeDiscountCode(tx, clinicId, dto.discountCodeId);
      return tx.appointment.create({
        data: {
          ...dto,
          clinicId,
        },
        include: { patient: true, doctor: true, room: true, service: true },
      });
    });
  }

  findAllByClinic(clinicId: string, filters: AppointmentFiltersDto) {
    return this.prisma.appointment.findMany({
      where: {
        clinicId,
        doctorId: filters.doctorId ?? undefined,
        departmentId: filters.departmentId ?? undefined,
        ...(filters.startDate &&
          filters.endDate && {
            scheduledAt: {
              gte: new Date(filters.startDate),
              lte: new Date(filters.endDate),
            },
          }),
      },
      include: appointmentInclude,
      orderBy: { scheduledAt: "asc" },
    });
  }

  findById(clinicId: string, id: string, doctorId?: string) {
    return this.prisma.appointment.findUnique({
      where: { id, clinicId, doctorId },
      include: { ...appointmentInclude, department: true },
    });
  }

  update(
    clinicId: string,
    id: string,
    dto: Omit<UpdateAppointmentDto, "feeOverride"> & {
      fee?: number;
      discount?: number;
      discountType?: DiscountTypeDto | string;
      discountReason?: string;
      statusUpdatedBy?: string;
      statusUpdatedAt?: Date;
      waitingStartedAt?: Date | null;
      inProgressAt?: Date | null;
      waitingMins?: number | null;
    } & Partial<PackageRedemption>,
    expectedUpdatedAt?: Date,
  ) {
    return this.write(clinicId, async (tx) => {
      const current = await this.current(tx, clinicId, id, expectedUpdatedAt);
      const presenceChanged =
        (dto.scheduledAt !== undefined &&
          new Date(dto.scheduledAt).getTime() !== current.scheduledAt.getTime()) ||
        (dto.sessionType !== undefined && dto.sessionType !== current.sessionType) ||
        (dto.meetingUrl !== undefined && dto.meetingUrl !== current.meetingUrl);
      const resetPresence = presenceChanged && !current.inProgressAt;
      if (dto.discountCodeId && dto.discountCodeId !== current.discountCodeId)
        await this.consumeDiscountCode(tx, clinicId, dto.discountCodeId);
      const status = dto.status ?? current.status;
      if (status !== "cancelled" && status !== "no_show") {
        await this.assertNoConflict(
          tx,
          clinicId,
          dto.doctorId ?? current.doctorId,
          dto.roomId === undefined ? current.roomId : dto.roomId,
          dto.scheduledAt ? new Date(dto.scheduledAt) : current.scheduledAt,
          dto.durationMins ?? current.durationMins,
          id,
        );
      }
      return tx.appointment.update({
        where: { id, clinicId },
        data: {
          ...dto,
          ...(resetPresence && {
            presenceConfirmedAt: null,
            presenceConfirmedById: null,
            presenceSource: null,
            waitingStartedAt: null,
            ...((current.status === "checked_in" || current.status === "waiting") && {
              status: dto.status ?? "confirmed",
            }),
          }),
          revision: { increment: 1 },
          updatedAt: nextRevision(current.updatedAt),
        },
        include: appointmentInclude,
      });
    });
  }

  markPaid(
    clinicId: string,
    id: string,
    data: {
      isPaid: boolean;
      paidAt: Date;
      paidById: string;
      paymentMethodId: string;
    },
    expectedUpdatedAt?: Date,
  ) {
    return this.write(clinicId, async (tx) => {
      const current = await this.current(tx, clinicId, id, expectedUpdatedAt);
      if (current.isPaid || current.patientPackageId)
        throw new BadRequestException("This appointment is already paid");
      return tx.appointment.update({
        where: { id, clinicId },
        data: {
          ...data,
          revision: { increment: 1 },
          updatedAt: nextRevision(current.updatedAt),

          paymentMethod: null,
        },
        include: appointmentInclude,
      });
    });
  }

  setPackageRedemption(
    clinicId: string,
    id: string,
    data: PackageRedemption,
    expectedUpdatedAt?: Date,
  ) {
    return this.write(clinicId, async (tx) => {
      const current = await this.current(tx, clinicId, id, expectedUpdatedAt);
      if (data.patientPackageId) {
        if (current.isPaid || current.patientPackageId)
          throw new BadRequestException("This appointment is already paid");
        const enrollment = await tx.patientPackage.findFirst({
          where: {
            id: data.patientPackageId,
            clinicId,
            patientId: current.patientId,
            isActive: true,
          },
        });
        if (!enrollment)
          throw new BadRequestException("Invalid patient package");
        const usage = await tx.appointment.aggregate({
          where: {
            patientPackageId: enrollment.id,
            id: { not: id },
            status: { notIn: ["cancelled", "no_show"] },
          },
          _count: true,
          _sum: { packageCredit: true },
        });
        if (enrollment.sessionsTotal !== null) {
          if (usage._count >= enrollment.sessionsTotal)
            throw new BadRequestException("No sessions left in this package");
        } else {
          const remaining = new Prisma.Decimal(
            enrollment.creditTotal ?? 0,
          ).minus(usage._sum.packageCredit ?? 0);
          if (remaining.lte(0) || remaining.lt(data.packageCredit ?? 0))
            throw new BadRequestException("No credit left in this package");
        }
      } else if (!current.patientPackageId) {
        throw new BadRequestException(
          "This appointment is not covered by a package",
        );
      }
      return tx.appointment.update({
        where: { id, clinicId },
        data: {
          ...data,
          revision: { increment: 1 },
          updatedAt: nextRevision(current.updatedAt),
        },
        include: appointmentInclude,
      });
    });
  }

  markUnpaid(clinicId: string, id: string, expectedUpdatedAt?: Date) {
    return this.write(clinicId, async (tx) => {
      const current = await this.current(tx, clinicId, id, expectedUpdatedAt);
      if (current.patientPackageId)
        throw new BadRequestException(
          "Release package coverage instead of marking unpaid",
        );
      return tx.appointment.update({
        where: { id, clinicId },
        data: {
          revision: { increment: 1 },
          updatedAt: nextRevision(current.updatedAt),
          isPaid: false,
          paidAt: null,
          paidById: null,
          paymentMethodId: null,
          paymentMethod: null,
        },
        include: appointmentInclude,
      });
    });
  }

  private async findConflict(
    clinicId: string,
    resource: { roomId: string } | { doctorId: string },
    scheduledAt: Date,
    durationMins: number,
    excludeId: string | undefined,
    db: Prisma.TransactionClient,
  ) {
    const doctor =
      "doctorId" in resource
        ? await db.clinicUser.findUniqueOrThrow({
            where: { id: resource.doctorId, clinicId },
            select: { bufferMins: true },
          })
        : null;
    const bufferMins = Math.max(0, doctor?.bufferMins ?? 0);
    const endAt = new Date(
      scheduledAt.getTime() + (durationMins + bufferMins) * 60_000,
    );
    const resourceFilter =
      "roomId" in resource
        ? Prisma.sql`"roomId" = ${resource.roomId}`
        : Prisma.sql`"doctorId" = ${resource.doctorId}`;
    const excludeFilter = excludeId
      ? Prisma.sql`AND "id" <> ${excludeId}`
      : Prisma.empty;
    const [conflict] = await db.$queryRaw<Appointment[]>(Prisma.sql`
      SELECT * FROM "Appointment"
      WHERE "clinicId" = ${clinicId} AND ${resourceFilter}
        ${excludeFilter}
        AND "status" NOT IN ('cancelled', 'no_show')
        AND "scheduledAt" < ${endAt}
        AND "scheduledAt" + ("durationMins" + ${bufferMins}::integer) * interval '1 minute' > ${scheduledAt}
      LIMIT 1
    `);
    return conflict;
  }
}
