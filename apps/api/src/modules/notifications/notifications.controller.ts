import {
  Controller,
  Delete,
  Get,
  Param,
  Body,
  Patch,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/guards";
import { CurrentUser, type AuthUser } from "@/modules/auth/decorators";
import { NotificationsService } from "./notifications.service";
import { NotificationPrefsDto } from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.notificationsService.findAll({
      clinicId: user.clinicId,
      userId: user.clinicUserId,
    });
  }

  @Get("preferences")
  preferences(@CurrentUser() user: AuthUser) {
    return this.notificationsService.preferences(user.clinicId, user.clinicUserId);
  }

  @Put("preferences")
  setPreferences(@CurrentUser() user: AuthUser, @Body() dto: NotificationPrefsDto) {
    return this.notificationsService.setPreferences(user.clinicId, user.clinicUserId, dto);
  }

  @Delete()
  clear(@CurrentUser() user: AuthUser) {
    return this.notificationsService.clear(user.clinicId, user.clinicUserId);
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
