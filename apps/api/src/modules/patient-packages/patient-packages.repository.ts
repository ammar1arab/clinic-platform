import { Injectable } from "@nestjs/common";
import { AppointmentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

/** Visits that never owe money, so they never count as dues. */
const NON_BILLABLE: AppointmentStatus[] = [
  AppointmentStatus.cancelled,
  AppointmentStatus.no_show,
];

@Injectable()
export class PatientPackagesRepository {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.PatientPackageUncheckedCreateInput) {
    return this.prisma.patientPackage.create({
      data,
      include: { package: { select: { name: true } } },
    });
  }

  findById(clinicId: string, id: string) {
    return this.prisma.patientPackage.findFirst({
      where: { id, clinicId },
      include: { package: { select: { name: true } } },
    });
  }

  findByPatient(clinicId: string, patientId: string, activeOnly = true) {
    return this.prisma.patientPackage.findMany({
      where: { clinicId, patientId, ...(activeOnly ? { isActive: true } : {}) },
      include: { package: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  setActive(id: string, isActive: boolean) {
    return this.prisma.patientPackage.update({
      where: { id },
      data: { isActive },
      include: { package: { select: { name: true } } },
    });
  }

  /**
   * Redemptions per enrollment. A session-based enrollment only ever has
   * `packageCredit: null` rows, a credit-based one only ever has non-null rows, so the
   * row count and the credit sum each answer exactly one kind of enrollment.
   * Cancelled / no-show visits never consume balance.
   */
  aggregateUsage(enrollmentIds: string[]) {
    if (enrollmentIds.length === 0) {
      return Promise.resolve(
        [] as Array<{
          patientPackageId: string | null;
          _count: { _all: number };
          _sum: { packageCredit: Prisma.Decimal | null };
        }>,
      );
    }
    return this.prisma.appointment.groupBy({
      by: ["patientPackageId"],
      where: {
        patientPackageId: { in: enrollmentIds },
        status: { notIn: NON_BILLABLE },
      },
      _count: { _all: true },
      _sum: { packageCredit: true },
    });
  }

  /** Past visits the patient still owes money on (optionally excluding the open visit). */
  findUnpaidVisits(clinicId: string, patientId: string, excludeAppointmentId?: string) {
    return this.prisma.appointment.findMany({
      where: {
        clinicId,
        patientId,
        isPaid: false,
        status: { notIn: NON_BILLABLE },
        scheduledAt: { lt: new Date() },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
      select: { fee: true, discount: true, discountType: true },
    });
  }
}
