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
import { ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/guards";
import { PatientsService } from "./patients.service";
import { CreatePatientDto, UpdatePatientDto, PatientFiltersDto } from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("patients")
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Post()
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Get()
  @ApiQuery({ name: "clinicId", required: true, type: String })
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
  findAll(@Query() filters: PatientFiltersDto) {
    return this.patientsService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.patientsService.deactivate(id);
  }

  @Patch(":id/reactivate")
  reactivate(@Param("id") id: string) {
    return this.patientsService.reactivate(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.patientsService.remove(id);
  }
}
