import { Module } from "@nestjs/common";
import { ReferralsController } from "./referrals.controller";
import { ReferralsService } from "./referrals.service";
import { ReferralsRepository } from "./referrals.repository";
import { NotificationsModule } from "@/modules/notifications/notifications.module";
import { DashboardModule } from "@/modules/dashboard/dashboard.module";

@Module({
  imports: [NotificationsModule, DashboardModule],
  controllers: [ReferralsController],
  providers: [ReferralsService, ReferralsRepository],
  exports: [ReferralsService, ReferralsRepository],
})
export class ReferralsModule {}
