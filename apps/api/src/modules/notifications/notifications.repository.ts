import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateNotificationDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        clinicId: dto.clinicId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        payload: dto.payload as Prisma.InputJsonValue | undefined,
      },
    });
  }

  findRecent(clinicId: string, userId: string, take = 50) {
    return this.prisma.notification.findMany({
      where: { clinicId, userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  markAllRead(clinicId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { clinicId, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
