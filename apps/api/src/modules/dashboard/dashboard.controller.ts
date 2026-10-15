import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { CurrentUser, Roles, type AuthUser } from "@/modules/auth/decorators";
import { DashboardService } from "./dashboard.service";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.owner, Role.admin, Role.financial)
@Controller("dashboard")
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get("kpis")
  getKpis(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getKpis(user.clinicId);
  }

  @Get("room-utilization")
  getRoomUtilization(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getRoomUtilization(user.clinicId);
  }
}
