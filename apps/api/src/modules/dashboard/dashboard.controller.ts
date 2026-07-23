import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/guards";
import { DashboardService } from "./dashboard.service";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get("kpis")
  getKpis(@Query("clinicId") clinicId: string) {
    return this.dashboardService.getKpis(clinicId);
  }

  @Get("room-utilization")
  getRoomUtilization(@Query("clinicId") clinicId: string) {
    return this.dashboardService.getRoomUtilization(clinicId);
  }
}
