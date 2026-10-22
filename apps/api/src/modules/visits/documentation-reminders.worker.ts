import { SHARED_EN } from "@clinic/types";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { NOTIFICATION_TYPE, resolveNotificationPrefs } from "@clinic/types";
import { VisitsRepository } from "./visits.repository";
import { DashboardGateway } from "@/modules/dashboard/dashboard.gateway";
import { createLogger } from "@/infrastructure/logger";
@Injectable()
export class DocumentationRemindersWorker
  implements OnModuleInit, OnModuleDestroy
{
  private timer?: ReturnType<typeof setInterval>;
  private active = false;
  private readonly log = createLogger("DocumentationReminders");
  constructor(
    private readonly repo: VisitsRepository,
    private readonly gateway: DashboardGateway,
  ) {}
  onModuleInit() {
    if (process.env.VISIT_REMINDERS_ENABLED === "false") return;
    this.timer = setInterval(() => {
      void this.tick();
    }, 60_000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async tick() {
    if (this.active) return;
    this.active = true;
    try {
      const now = new Date();
      const soon = new Date(now.getTime() + 3600_000);
      const rows = await this.repo.db.visit.findMany({
        where: {
          noteStatus: { not: "signed" },
          unlockGrantedAt: null,
          OR: [
            {
              documentationDeadlineAt: { lte: now },
              events: { none: { kind: NOTIFICATION_TYPE.DOCUMENTATION_LOCKED } },
            },
            {
              documentationDeadlineAt: { gt: now, lte: soon },
              events: { none: { kind: NOTIFICATION_TYPE.DOCUMENTATION_DUE } },
            },
          ],
        },
        select: { id: true, clinicId: true, appointmentId: true },
        take: 100,
      });
      for (const row of rows) {
        const recipients = await this.repo.transaction(async (tx) => {
          await tx.$queryRaw`SELECT "id" FROM "Appointment" WHERE "id" = ${row.appointmentId} AND "clinicId" = ${row.clinicId} FOR UPDATE`;
          const visit = await tx.visit.findFirst({
            where: { id: row.id, clinicId: row.clinicId },
            include: { appointment: true },
          });
          if (!visit || visit.noteStatus === "signed" || visit.unlockGrantedAt)
            return [];
          const kind =
            visit.documentationDeadlineAt <= new Date()
              ? NOTIFICATION_TYPE.DOCUMENTATION_LOCKED
              : NOTIFICATION_TYPE.DOCUMENTATION_DUE;
          if (await tx.visitEvent.count({ where: { visitId: row.id, kind } }))
            return [];
          const owners = await tx.clinicUser.findMany({
            where: { clinicId: row.clinicId, role: "owner", isActive: true },
            select: { id: true },
          });
          const candidates = [
            ...new Set([
              visit.appointment.doctorId,
              ...owners.map((owner) => owner.id),
            ]),
          ];
          const prefRows = await tx.clinicUser.findMany({
            where: { id: { in: candidates }, clinicId: row.clinicId },
            select: { id: true, notificationPrefs: true },
          });
          const ids = prefRows
            .filter((user) => resolveNotificationPrefs(user.notificationPrefs).documentation)
            .map((user) => user.id);
          await tx.visitEvent.create({
            data: {
              clinicId: row.clinicId,
              visitId: row.id,
              actorId: "system:documentation-reminders",
              kind,
            },
          });
          await tx.notification.createMany({
            data: ids.map((userId) => ({
              clinicId: row.clinicId,
              userId,
              type: kind,
              title: SHARED_EN.notificationTypes[kind],
              payload: {
                visitId: row.id,
                appointmentId: row.appointmentId,
                documentationDeadlineAt:
                  visit.documentationDeadlineAt.toISOString(),

              },
            })),
          });
          return ids;
        });
        for (const id of recipients)
          this.gateway.emitNotificationCreated(row.clinicId, id);
      }
    } catch {
      this.log.warn("documentation_reminder_failed");
    } finally {
      this.active = false;
    }
  }
}
