import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';

@Injectable()
export class DepartmentsRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: dto });
  }

  findAllByClinic(clinicId: string) {
    return this.prisma.department.findMany({
      where: { clinicId },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.department.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateDepartmentDto) {
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  deactivate(id: string) {
    return this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
  }

  reactivate(id: string) {
    return this.prisma.department.update({
      where: { id },
      data: { isActive: true },
    });
  }

  hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const rooms = await tx.room.findMany({
        where: { departmentId: id },
        select: { id: true },
      });
      const services = await tx.service.findMany({
        where: { departmentId: id },
        select: { id: true },
      });
      const roomIds = rooms.map((r) => r.id);
      const serviceIds = services.map((s) => s.id);

      await tx.appointment.deleteMany({
        where: {
          OR: [
            { departmentId: id },
            ...(roomIds.length ? [{ roomId: { in: roomIds } }] : []),
            ...(serviceIds.length ? [{ serviceId: { in: serviceIds } }] : []),
          ],
        },
      });

      await tx.service.deleteMany({ where: { departmentId: id } });
      await tx.room.deleteMany({ where: { departmentId: id } });

      return tx.department.delete({ where: { id } });
    });
  }
}