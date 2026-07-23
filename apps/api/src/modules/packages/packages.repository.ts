import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { CreatePackageDto, UpdatePackageDto } from "./dto";

@Injectable()
export class PackagesRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePackageDto) {
    const data: Prisma.PackageUncheckedCreateInput = {
      clinicId: dto.clinicId,
      name: dto.name,
      description: dto.description,
      sessionCount: dto.sessionCount,
      price: dto.price,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    };
    return this.prisma.package.create({ data });
  }

  findAllByClinic(clinicId: string) {
    return this.prisma.package.findMany({
      where: { clinicId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  findById(id: string) {
    return this.prisma.package.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdatePackageDto) {
    const data: Prisma.PackageUncheckedUpdateInput = {
      name: dto.name,
      description: dto.description,
      sessionCount: dto.sessionCount,
      price: dto.price,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    };
    return this.prisma.package.update({ where: { id }, data });
  }

  deactivate(id: string) {
    return this.prisma.package.update({
      where: { id },
      data: { isActive: false },
    });
  }

  hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.patient.updateMany({
        where: { packageId: id },
        data: { packageId: null },
      });
      return tx.package.delete({ where: { id } });
    });
  }
}
