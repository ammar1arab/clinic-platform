import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateNotificationDto } from "./dto";
import { Prisma } from "@prisma/client";
import {
  NOTIFICATION_LIMIT,
  NOTIFICATION_RETENTION_DAYS,
  notificationCategoryOf,
  notificationCategoriesForRole,
  resolveNotificationPrefs,
  type NotificationPrefs,
} from "@clinic/types";

@Injectable()
export class NotificationsRepository {
  constructor(private prisma: PrismaService) {}

  async preferences(clinicId: string, userId: string) {
    const row = await this.prisma.clinicUser.findFirst({
      where: { id: userId, clinicId },
      select: { notificationPrefs: true },
    });
    return resolveNotificationPrefs(row?.notificationPrefs);
  }

  async setPreferences(clinicId: string, userId: string, prefs: Partial<NotificationPrefs>) {
    const row = await this.prisma.clinicUser.findFirstOrThrow({ where: { id: userId, clinicId }, select: { notificationPrefs: true, role: true } });
    const next = resolveNotificationPrefs(row.notificationPrefs);
    for (const key of notificationCategoriesForRole(row.role)) {
      if (typeof prefs[key] === "boolean") next[key] = prefs[key];
    }
    await this.prisma.clinicUser.update({ where: { id: userId, clinicId }, data: { notificationPrefs: next } });
    return next;
  }

  async create(dto: CreateNotificationDto) {
    const category = notificationCategoryOf(dto.type);
    if (category && !(await this.preferences(dto.clinicId, dto.userId))[category]) return null;
    const created = await this.prisma.notification.create({
      data: {
        clinicId: dto.clinicId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        payload: dto.payload as Prisma.InputJsonValue | undefined,
      },
    });
    await this.trim(dto.clinicId, dto.userId);
    return created;
  }

  findRecent(clinicId: string, userId: string, take = NOTIFICATION_LIMIT) {
    return this.prisma.notification.findMany({
      where: { clinicId, userId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  private async trim(clinicId: string, userId: string) {
    const overflow = await this.prisma.notification.findMany({
      where: { clinicId, userId },
      orderBy: { createdAt: "desc" },
      skip: NOTIFICATION_LIMIT,
      select: { id: true },
    });
    if (!overflow.length) return;
    await this.prisma.notification.deleteMany({
      where: { id: { in: overflow.map((row) => row.id) } },
    });
  }

  clear(clinicId: string, userId: string) {
    return this.prisma.notification.deleteMany({ where: { clinicId, userId } });
  }

  purgeExpired() {
    const cutoff = new Date(Date.now() - NOTIFICATION_RETENTION_DAYS * 86_400_000);
    return this.prisma.notification.deleteMany({ where: { createdAt: { lt: cutoff } } });
  }

  findById(id: string, clinicId: string, userId: string) {
    return this.prisma.notification.findUnique({
      where: { id, clinicId, userId },
    });
  }

  markRead(id: string, clinicId: string, userId: string) {
    return this.prisma.notification.update({
      where: { id, clinicId, userId },
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
