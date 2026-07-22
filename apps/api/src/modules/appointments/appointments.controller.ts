import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '@/modules/auth/guards';
import { CurrentUser, Roles } from '@/modules/auth/decorators';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentFiltersDto,
  MarkPaidDto,
} from './dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user.clinicId, user.userId, dto);
  }

  @Get()
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'doctorId', required: false, type: String })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  findAll(@CurrentUser() user: any, @Query() filters: AppointmentFiltersDto) {
    return this.appointmentsService.findAll(user.clinicId, filters);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.appointmentsService.findOne(user.clinicId, id);
  }

  @Patch(':id/mark-paid')
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  markPaid(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
  ) {
    return this.appointmentsService.markPaid(
      user.clinicId,
      user.clinicUserId,
      id,
      dto,
    );
  }

  @Patch(':id/mark-unpaid')
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  markUnpaid(@CurrentUser() user: any, @Param('id') id: string) {
    return this.appointmentsService.markUnpaid(user.clinicId, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(user.clinicId, user.userId, id, dto);
  }
}
