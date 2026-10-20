import { ScheduleRequestsService } from "./schedule-requests.service";
import { CreateScheduleRequestDto, ReviewScheduleRequestDto, ScheduleRequestFiltersDto } from "./dto/schedule-request.dto";
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { CurrentUser, Roles, type AuthUser } from "@/modules/auth/decorators";
import { PractitionersService } from "./practitioners.service";
import {
  AssignServicesDto,
  CreatePractitionerDto,
  PractitionerFiltersDto,
  ReplaceAvailabilityDto,
  ReplaceTimeOffDto,
  UpdatePractitionerDto,
  SelfProfileDto,
} from "./dto";
import { ConfirmPasswordChangeDto } from "@/modules/auth/dto/auth-flow.dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("practitioners")
export class PractitionersController {
  constructor(private practitionersService: PractitionersService, private scheduleRequests: ScheduleRequestsService) {}

  @Get("schedule-requests")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.practitioner)
  listScheduleRequests(@CurrentUser() user: AuthUser, @Query() filters: ScheduleRequestFiltersDto) {
    return this.scheduleRequests.list(user, filters);
  }

  @Post("schedule-requests")
  @UseGuards(RolesGuard)
  @Roles(Role.practitioner)
  createScheduleRequest(@CurrentUser() user: AuthUser, @Body() dto: CreateScheduleRequestDto) {
    return this.scheduleRequests.create(user, dto);
  }

  @Patch("schedule-requests/:requestId")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.practitioner)
  reviewScheduleRequest(@CurrentUser() user: AuthUser, @Param("requestId") id: string, @Body() dto: ReviewScheduleRequestDto) {
    return this.scheduleRequests.review(user, id, dto);
  }

  @Post(":id/reset-password")
  @Header("Cache-Control", "no-store")
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  resetPassword(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.practitionersService.resetPassword(id, user);
  }

  @Post(":id/reset-password/confirm")
  @Header("Cache-Control", "no-store")
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  confirmPasswordReset(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ConfirmPasswordChangeDto,
  ) {
    return this.practitionersService.confirmPasswordReset(
      id,
      user,
      dto.token,
      dto.code,
      dto.password,
    );
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePractitionerDto) {
    return this.practitionersService.create({
      ...dto,
      clinicId: user.clinicId,
    });
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() filters: PractitionerFiltersDto,
  ) {
    return this.practitionersService.findAll(user.clinicId, filters);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.practitionersService.findOne(id, user.clinicId);
  }

  @Patch(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  deactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.practitionersService.deactivate(id, user.clinicId);
  }

  @Patch(":id/reactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  reactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.practitionersService.reactivate(id, user.clinicId);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.practitionersService.remove(id, user.clinicId);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdatePractitionerDto,
  ) {
    return this.practitionersService.update(id, dto, user.clinicId);
  }

  @Patch(":id/self-profile")
  @UseGuards(RolesGuard)
  @Roles(Role.practitioner)
  updateSelfProfile(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: SelfProfileDto,
  ) {
    return this.practitionersService.updateSelfProfile(id, dto, user);
  }

  @Put(":id/services")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  replaceServices(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: AssignServicesDto,
  ) {
    return this.practitionersService.replaceServices(id, dto, user.clinicId);
  }

  @Put(":id/availability")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  replaceAvailability(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ReplaceAvailabilityDto,
  ) {
    return this.practitionersService.replaceAvailability(
      id,
      dto,
      user.clinicId,
    );
  }

  @Put(":id/time-off")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  replaceTimeOff(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ReplaceTimeOffDto,
  ) {
    return this.practitionersService.replaceTimeOff(id, dto, user.clinicId);
  }
}
