import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DashboardRepository {
  constructor(private prisma: PrismaService) {}

  findTodayAppointments(clinicId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.appointment.findMany({
      where: {
        clinicId,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
      include: { room: true },
    });
  }

  findClinicWorkingHours(clinicId: string) {
    return this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { workingHoursStart: true, workingHoursEnd: true },
    });
  }

  findActiveRooms(clinicId: string) {
    return this.prisma.room.findMany({
      where: { clinicId, isActive: true },
    });
  }

  countActiveRooms(clinicId: string) {
    return this.prisma.room.count({
      where: { clinicId, isActive: true },
    });
  }
}
