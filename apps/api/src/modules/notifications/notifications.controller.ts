import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/guards";
import { CurrentUser, type AuthUser } from "@/modules/auth/decorators";
import { NotificationsService } from "./notifications.service";
import { NotificationFiltersDto } from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() filters: NotificationFiltersDto,
  ) {
    return this.notificationsService.findAll({
      ...filters,
      clinicId: user.clinicId,
      userId: user.clinicUserId,
    });
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(
      user.clinicId,
      user.clinicUserId,
    );
  }

  @Patch(":id/read")
  markRead(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.notificationsService.markRead(
      id,
      user.clinicId,
      user.clinicUserId,
    );
  }
}
