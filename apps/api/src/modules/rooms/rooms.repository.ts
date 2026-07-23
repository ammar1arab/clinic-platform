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

  findById(id: string) {
    return this.prisma.room.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateRoomDto) {
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  deactivate(id: string) {
    return this.prisma.room.update({
      where: { id },
      data: { isActive: false },
    });
  }

  reactivate(id: string) {
    return this.prisma.room.update({
      where: { id },
      data: { isActive: true },
    });
  }

  hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.appointment.deleteMany({
        where: { roomId: id },
      });

      return tx.room.delete({ where: { id } });
    });
  }
}
