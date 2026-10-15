import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateRoomDto, UpdateRoomDto } from "./dto";

@Injectable()
export class RoomsRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateRoomDto) {
    return this.prisma.room.create({ data: dto });
  }

  findAllByClinic(clinicId: string) {
    return this.prisma.room.findMany({
      where: { clinicId },
      orderBy: { name: "asc" },
    });
  }

  departmentInClinic(id: string, clinicId: string) {
    return this.prisma.department.count({ where: { id, clinicId } });
  }

  findById(id: string, clinicId: string) {
    return this.prisma.room.findUnique({ where: { id, clinicId } });
  }

  update(id: string, dto: UpdateRoomDto, clinicId: string) {
    return this.prisma.room.update({ where: { id, clinicId }, data: dto });
  }

  deactivate(id: string, clinicId: string) {
    return this.prisma.room.update({
      where: { id, clinicId },
      data: { isActive: false },
    });
  }

  reactivate(id: string, clinicId: string) {
    return this.prisma.room.update({
      where: { id, clinicId },
      data: { isActive: true },
    });
  }

  hardDelete(id: string, clinicId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.appointment.deleteMany({
        where: { roomId: id, clinicId },
      });

      return tx.room.delete({ where: { id, clinicId } });
    });
  }
}
