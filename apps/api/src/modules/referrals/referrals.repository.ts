import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateReferralDto, ReferralFiltersDto } from "./dto";

@Injectable()
export class ReferralsRepository {
  constructor(private prisma: PrismaService) {}

  private readonly include = {
    fromDoctor: { select: { id: true, name: true } },
    toDoctor: { select: { id: true, name: true } },
    appointment: {
      select: {
        id: true,
        patientId: true,
        scheduledAt: true,
        patient: {
          select: {
            id: true,
            firstNameEn: true,
            lastNameEn: true,
            firstNameAr: true,
            lastNameAr: true,
          },
        },
      },
    },
  };

  create(data: CreateReferralDto & { fromDoctorId: string }) {
    return this.prisma.referral.create({
      data: {
        clinicId: data.clinicId,
        appointmentId: data.appointmentId,
        fromDoctorId: data.fromDoctorId,
        toDoctorId: data.toDoctorId,
        type: data.type,
        urgency: data.urgency ?? "normal",
        reason: data.reason,
      },
      include: this.include,
    });
  }

  findAll(filters: ReferralFiltersDto) {
    return this.prisma.referral.findMany({
      where: {
        clinicId: filters.clinicId,
        toDoctorId: filters.toDoctorId ?? undefined,
        status: filters.status ?? undefined,
        ...(filters.patientId
          ? { appointment: { patientId: filters.patientId } }
          : {}),
      },
      include: this.include,
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string) {
    return this.prisma.referral.findUnique({
      where: { id },
      include: this.include,
    });
  }

  updateStatus(id: string, status: "accepted" | "rejected") {
    return this.prisma.referral.update({
      where: { id },
      data: { status },
      include: this.include,
    });
  }

  updateOpinion(id: string, opinion: string) {
    return this.prisma.referral.update({
      where: { id },
      data: { opinion },
      include: this.include,
    });
  }

  findByPatientId(patientId: string) {
    return this.prisma.referral.findMany({
      where: { appointment: { patientId } },
      include: this.include,
      orderBy: { createdAt: "desc" },
    });
  }
}
