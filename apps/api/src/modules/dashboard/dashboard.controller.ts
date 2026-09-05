import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { Roles } from "@/modules/auth/decorators";
import { DashboardService } from "./dashboard.service";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.owner, Role.admin, Role.financial)
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
