import { Injectable } from "@nestjs/common";
import { AppointmentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

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

  findUnpaidVisits(
    clinicId: string,
    patientId: string,
    excludeAppointmentId?: string,
  ) {
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
