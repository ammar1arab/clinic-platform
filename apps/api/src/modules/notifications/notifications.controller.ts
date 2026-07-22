import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards';
import { NotificationsService } from './notifications.service';
import { NotificationFiltersDto } from './dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(@Query() filters: NotificationFiltersDto) {
    return this.notificationsService.findAll(filters);
  }

  @Patch('read-all')
  markAllRead(
    @Query('clinicId') clinicId: string,
    @Query('userId') userId: string,
  ) {
    return this.notificationsService.markAllRead(clinicId, userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }
}
