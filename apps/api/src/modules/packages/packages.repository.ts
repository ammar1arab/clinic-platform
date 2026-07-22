import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePackageDto, UpdatePackageDto } from './dto';

@Injectable()
export class PackagesRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePackageDto) {
    return this.prisma.package.create({ data: dto as any });
  }

  findAllByClinic(clinicId: string) {
    return this.prisma.package.findMany({
      where: { clinicId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.package.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdatePackageDto) {
    return this.prisma.package.update({ where: { id }, data: dto as any });
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
