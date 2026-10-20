import { DashboardModule } from "@/modules/dashboard/dashboard.module";
import { NotificationsModule } from "@/modules/notifications/notifications.module";
import { ScheduleRequestsService } from "./schedule-requests.service";
import { AuthModule } from "@/modules/auth/auth.module";
import { Module } from "@nestjs/common";
import { PractitionersController } from "./practitioners.controller";
import { PractitionersService } from "./practitioners.service";
import { PractitionersRepository } from "./practitioners.repository";

@Module({
  imports: [AuthModule, NotificationsModule, DashboardModule],
  controllers: [PractitionersController],
  providers: [PractitionersService, PractitionersRepository, ScheduleRequestsService],
  exports: [PractitionersService],
})
export class PractitionersModule {}
