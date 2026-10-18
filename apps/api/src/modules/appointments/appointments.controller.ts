import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { CurrentUser, Roles, type AuthUser } from "@/modules/auth/decorators";
import { AppointmentsService } from "./appointments.service";
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentFiltersDto,
  MarkPaidDto,
  RedeemPackageDto,
} from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("appointments")
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user.clinicId, user.userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial, Role.practitioner)
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  @ApiQuery({ name: "doctorId", required: false, type: String })
  @ApiQuery({ name: "departmentId", required: false, type: String })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() filters: AppointmentFiltersDto,
  ) {
    return this.appointmentsService.findAll(
      user.clinicId,
      filters,
      user.role,
      user.clinicUserId,
    );
  }

  @Get(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial, Role.practitioner)
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.appointmentsService.findOne(
      user.clinicId,
      id,
      user.role === Role.practitioner ? user.clinicUserId : undefined,
    );
  }

  @Patch(":id/mark-paid")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  markPaid(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: MarkPaidDto,
  ) {
    return this.appointmentsService.markPaid(
      user.clinicId,
      user.clinicUserId,
      id,
      dto,
    );
  }

  @Patch(":id/mark-unpaid")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  markUnpaid(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.appointmentsService.markUnpaid(user.clinicId, id);
  }

  @Patch(":id/redeem-package")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  redeemPackage(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: RedeemPackageDto,
  ) {
    return this.appointmentsService.redeemPackage(
      user.clinicId,
      user.clinicUserId,
      id,
      dto,
    );
  }

  @Patch(":id/release-package")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  releasePackage(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.appointmentsService.releasePackage(user.clinicId, id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.practitioner)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(
      user.clinicId,
      user.userId,
      id,
      dto,
      user,
    );
  }
}
