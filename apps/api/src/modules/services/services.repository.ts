import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateServiceDto, UpdateServiceDto } from "./dto";

@Injectable()
export class ServicesRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }

  findAllByClinic(clinicId: string) {
    return this.prisma.service.findMany({
      where: { clinicId },
      orderBy: { name: "asc" },
    });
  }

  departmentInClinic(id: string, clinicId: string) {
    return this.prisma.department.count({ where: { id, clinicId } });
  }

  findById(id: string, clinicId: string) {
    return this.prisma.service.findUnique({ where: { id, clinicId } });
  }

  update(id: string, dto: UpdateServiceDto, clinicId: string) {
    return this.prisma.service.update({ where: { id, clinicId }, data: dto });
  }

  deactivate(id: string, clinicId: string) {
    return this.prisma.service.update({
      where: { id, clinicId },
      data: { isActive: false },
    });
  }

  reactivate(id: string, clinicId: string) {
    return this.prisma.service.update({
      where: { id, clinicId },
      data: { isActive: true },
    });
  }

  hardDelete(id: string, clinicId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.appointment.deleteMany({
        where: { serviceId: id, clinicId },
      });

      return tx.service.delete({ where: { id, clinicId } });
    });
  }
}
