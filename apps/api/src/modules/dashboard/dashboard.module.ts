import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DashboardRepository } from "./dashboard.repository";
import { DashboardGateway } from "./dashboard.gateway";
import { AuthModule } from "@/modules/auth/auth.module";
import { SecurityModule } from "@/security/security.module";

@Module({
  imports: [AuthModule, SecurityModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository, DashboardGateway],
  exports: [DashboardService, DashboardGateway],
})
export class DashboardModule {}
