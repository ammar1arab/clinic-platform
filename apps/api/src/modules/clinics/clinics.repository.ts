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

  async findStaff(clinicId: string) {
    const members = await this.prisma.clinicUser.findMany({
      where: { clinicId, isActive: true },
      select: {
        id: true,
        name: true,
        nameAr: true,
        role: true,
        initials: true,
        user: { select: { email: true } },
      },
      orderBy: { name: "asc" },
    });
    return members.map(({ user, ...member }) => ({
      ...member,
      email: user.email,
    }));
  }

  departmentInClinic(id: string, clinicId: string) {
    return this.prisma.department.count({ where: { id, clinicId } });
  }

  update(id: string, dto: UpdateClinicDto) {
    return this.prisma.clinic.update({ where: { id }, data: dto });
  }
}
