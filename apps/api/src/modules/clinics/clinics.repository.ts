import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateClinicDto, UpdateClinicDto } from "./dto";

@Injectable()
export class ClinicsRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateClinicDto) {
    return this.prisma.clinic.create({ data: dto });
  }

  findById(id: string) {
    return this.prisma.clinic.findUnique({ where: { id } });
  }

  findStaff(clinicId: string) {
    return this.prisma.clinicUser.findMany({
      where: { clinicId, isActive: true },
      select: { id: true, name: true, role: true, initials: true },
      orderBy: { name: "asc" },
    });
  }

  update(id: string, dto: UpdateClinicDto) {
    return this.prisma.clinic.update({ where: { id }, data: dto });
  }
}
