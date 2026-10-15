import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { Role } from "@prisma/client";
import { CurrentUser, Roles, type AuthUser } from "@/modules/auth/decorators";
import { ClinicsService } from "./clinics.service";
import { CreateClinicDto, UpdateClinicDto } from "./dto";

@Controller("clinics")
export class ClinicsController {
  constructor(private clinicsService: ClinicsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.owner)
  @Post()
  create(@Body() dto: CreateClinicDto) {
    return this.clinicsService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(":id/staff")
  findStaff(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    if (id !== user.clinicId) throw new ForbiddenException();
    return this.clinicsService.findStaff(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    if (id !== user.clinicId) throw new ForbiddenException();
    return this.clinicsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.owner, Role.admin)
  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateClinicDto,
  ) {
    if (id !== user.clinicId) throw new ForbiddenException();
    return this.clinicsService.update(id, dto);
  }
}
