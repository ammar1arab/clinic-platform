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
import { PatientPackagesService } from "./patient-packages.service";
import { EnrollPatientPackageDto } from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("patient-packages")
export class PatientPackagesController {
  constructor(private patientPackagesService: PatientPackagesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  enroll(@CurrentUser() user: AuthUser, @Body() dto: EnrollPatientPackageDto) {
    return this.patientPackagesService.enroll(user.clinicId, dto);
  }

  @Get()
  @ApiQuery({ name: "patientId", required: true, type: String })
  @ApiQuery({ name: "includeInactive", required: false, type: Boolean })
  findByPatient(
    @CurrentUser() user: AuthUser,
    @Query("patientId") patientId: string,
    @Query("includeInactive") includeInactive?: string,
  ) {
    return this.patientPackagesService.findWithBalance(
      user.clinicId,
      patientId,
      includeInactive !== "true",
    );
  }

  @Get("summary/:patientId")
  @ApiQuery({ name: "excludeAppointmentId", required: false, type: String })
  summary(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @Query("excludeAppointmentId") excludeAppointmentId?: string,
  ) {
    return this.patientPackagesService.getSummary(
      user.clinicId,
      patientId,
      excludeAppointmentId,
    );
  }

  @Patch(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  deactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.patientPackagesService.deactivate(user.clinicId, id);
  }
}
