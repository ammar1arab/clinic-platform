import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';

@Injectable()
export class ServicesRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }

  findAllByClinic(clinicId: string) {
    return this.prisma.service.findMany({
      where: { clinicId },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.service.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateServiceDto) {
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  deactivate(id: string) {
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  reactivate(id: string) {
    return this.prisma.service.update({
      where: { id },
      data: { isActive: true },
    });
  }

  hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.appointment.deleteMany({
        where: { serviceId: id },
      });

      return tx.service.delete({ where: { id } });
    });
  }
}