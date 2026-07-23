import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationsRepository } from "./notifications.repository";
import { DashboardModule } from "@/modules/dashboard/dashboard.module";

/**
 * In-app notifications (bell + sockets) today.
 * FUTURE: deliver push via Firebase Cloud Messaging (FCM) — not a fully
 * custom push stack. Keep this module as the domain layer; add FCM fan-out later.
 */
@Module({
  imports: [DashboardModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}
