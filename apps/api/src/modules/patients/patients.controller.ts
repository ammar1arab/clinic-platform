import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { CurrentUser, Roles, type AuthUser } from "@/modules/auth/decorators";
import { PatientsService } from "./patients.service";
import { CreatePatientDto, UpdatePatientDto, PatientFiltersDto } from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("patients")
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePatientDto) {
    return this.patientsService.create({ ...dto, clinicId: user.clinicId });
  }

  @Get()
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({
    name: "isActive",
    required: false,
    type: String,
    enum: ["true", "false"],
  })
  @ApiQuery({ name: "gender", required: false, type: String })
  @ApiQuery({ name: "bloodType", required: false, type: String })
  @ApiQuery({ name: "primaryDoctorId", required: false, type: String })
  @ApiQuery({ name: "departmentId", required: false, type: String })
  @ApiQuery({
    name: "visitFrom",
    required: false,
    type: String,
    description: "ISO date e.g. 2024-01-01",
  })
  @ApiQuery({
    name: "visitTo",
    required: false,
    type: String,
    description: "ISO date e.g. 2024-12-31",
  })
  @ApiQuery({
    name: "dobFrom",
    required: false,
    type: String,
    description: "ISO date e.g. 1990-01-01",
  })
  @ApiQuery({
    name: "dobTo",
    required: false,
    type: String,
    description: "ISO date e.g. 2005-12-31",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: [
      "createdAt",
      "updatedAt",
      "firstNameEn",
      "lastNameEn",
      "dob",
      "appointments",
    ],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  findAll(@CurrentUser() user: AuthUser, @Query() filters: PatientFiltersDto) {
    return this.patientsService.findAll(
      user.clinicId,
      filters,
      user.role === Role.practitioner ? user.clinicUserId : undefined,
    );
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.patientsService.findOne(id, user.clinicId);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, dto, user.clinicId);
  }

  @Patch(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  deactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.patientsService.deactivate(id, user.clinicId);
  }

  @Patch(":id/reactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  reactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.patientsService.reactivate(id, user.clinicId);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.patientsService.remove(id, user.clinicId);
  }
}
