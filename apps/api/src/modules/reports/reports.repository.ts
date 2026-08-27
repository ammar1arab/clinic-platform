import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ReportsRepository {
  constructor(private prisma: PrismaService) {}

  findClinicLetterhead(clinicId: string) {
    return this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        logoUrl: true,
        letterheadFooter: true,
      },
    });
  }

  findPatientForMedicalReport(clinicId: string, patientId: string) {
    return this.prisma.patient.findFirst({
      where: { id: patientId, clinicId },
      include: {
        primaryDoctor: { select: { id: true, name: true } },
        appointments: {
          orderBy: { scheduledAt: "desc" },
          include: {
            doctor: { select: { name: true } },
            service: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
    });
  }

  findReferralsForReport(params: {
    clinicId: string;
    patientId?: string;
    toDoctorId?: string;
    from?: Date;
    to?: Date;
  }) {
    const { clinicId, patientId, toDoctorId, from, to } = params;

    return this.prisma.referral.findMany({
      where: {
        clinicId,
        ...(toDoctorId ? { toDoctorId } : {}),
        ...(patientId ? { appointment: { patientId } } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        fromDoctor: { select: { name: true } },
        toDoctor: { select: { name: true } },
        appointment: {
          select: {
            scheduledAt: true,
            patient: {
              select: {
                firstNameEn: true,
                lastNameEn: true,
                nationalId: true,
              },
            },
          },
        },
      },
    });
  }

  findAppointmentsForFinanceReport(params: {
    clinicId: string;
    from?: Date;
    to?: Date;
  }) {
    const { clinicId, from, to } = params;

    return this.prisma.appointment.findMany({
      where: {
        clinicId,
        status: { not: "cancelled" },
        ...(from || to
          ? {
              scheduledAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { scheduledAt: "desc" },
      include: {
        patient: {
          select: { firstNameEn: true, lastNameEn: true, nationalId: true },
        },
        doctor: { select: { name: true } },
        service: { select: { name: true } },
        paymentMethodRef: { select: { name: true } },
      },
    });
  }
}
