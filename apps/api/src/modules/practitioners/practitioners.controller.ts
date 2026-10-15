import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
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
  ResetPractitionerPasswordDto,
} from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("practitioners")
export class PractitionersController {
  constructor(private practitionersService: PractitionersService) {}

  @Post(":id/reset-password")
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  resetPassword(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ResetPractitionerPasswordDto,
  ) {
    return this.practitionersService.resetPassword(id, user, dto.password);
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
  @ApiQuery({ name: "clinicId", required: true, type: String })
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
