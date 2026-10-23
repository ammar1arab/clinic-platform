import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  StreamableFile,
  ForbiddenException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiProduces, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { CurrentUser, Roles, type AuthUser } from "@/modules/auth/decorators";
import { Role } from "@prisma/client";
import { ReportsService } from "./reports.service";
import {
  ClinicAppointmentsReportQueryDto,
  DirectoryReportQueryDto,
  FinanceReportQueryDto,
  PatientReportQueryDto,
  PractitionerScopedReportQueryDto,
  ReferralsReportQueryDto,
  ReportFormatDto,
  VisitsReportQueryDto,
} from "./dto";
import type { ExportedReport } from "./exporters/report-exporter";

const PRODUCES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

function sendExport(res: Response, exported: ExportedReport) {
  res.set({
    "Content-Type": exported.contentType,
    "Content-Disposition": `attachment; filename="${exported.filename}"`,
    "Cache-Control": "no-store",
  });
  return new StreamableFile(exported.buffer);
}

@ApiTags("reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reports")
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  private practitionerScope(user: AuthUser, practitionerId: string) {
    if (user.role === Role.practitioner && user.clinicUserId !== practitionerId) {
      throw new ForbiddenException("Practitioners can only export their own reports");
    }
    return practitionerId;
  }

  @Get("patients/:patientId")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async patientMedical(
    @Param("patientId") patientId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: PatientReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPatientMedical(
        user.clinicId,
        patientId,
        query.format ?? ReportFormatDto.pdf,
      ),
    );
  }

  @Get("patients-directory")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async patientsDirectory(
    @CurrentUser() user: AuthUser,
    @Query() query: DirectoryReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPatientsDirectory({
        ...query,
        clinicId: user.clinicId,
      }),
    );
  }

  @Get("practitioners-directory")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async practitionersDirectory(
    @CurrentUser() user: AuthUser,
    @Query() query: DirectoryReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPractitionersDirectory({
        ...query,
        clinicId: user.clinicId,
      }),
    );
  }

  @Get("practitioners/:practitionerId/appointments")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial, Role.practitioner)
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async practitionerAppointments(
    @Param("practitionerId") practitionerId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: PractitionerScopedReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPractitionerAppointments({
        clinicId: user.clinicId,
        practitionerId: this.practitionerScope(user, practitionerId),
        format: query.format ?? ReportFormatDto.pdf,
        from: query.from,
        to: query.to,
      }),
    );
  }

  @Get("practitioners/:practitionerId/hours")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial, Role.practitioner)
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async practitionerHours(
    @Param("practitionerId") practitionerId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: PractitionerScopedReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPractitionerHours(
        user.clinicId,
        this.practitionerScope(user, practitionerId),
        query.format ?? ReportFormatDto.pdf,
        query.from,
        query.to,
      ),
    );
  }

  @Get("practitioners/:practitionerId/exceptions")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial, Role.practitioner)
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async practitionerExceptions(
    @Param("practitionerId") practitionerId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: PractitionerScopedReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPractitionerExceptions(
        user.clinicId,
        this.practitionerScope(user, practitionerId),
        query.format ?? ReportFormatDto.pdf,
        query.from,
        query.to,
      ),
    );
  }

  @Get("practitioners/:practitionerId")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial, Role.practitioner)
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async practitionerProfile(
    @Param("practitionerId") practitionerId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: PractitionerScopedReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPractitionerProfile(
        user.clinicId,
        this.practitionerScope(user, practitionerId),
        query.format ?? ReportFormatDto.pdf,
      ),
    );
  }

  @Get("visits")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial, Role.practitioner)
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async visits(
    @CurrentUser() user: AuthUser,
    @Query() query: VisitsReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportVisits(user, query),
    );
  }

  @Get("appointments")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async clinicAppointments(
    @CurrentUser() user: AuthUser,
    @Query() query: ClinicAppointmentsReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportClinicAppointments({
        clinicId: user.clinicId,
        format: query.format ?? ReportFormatDto.pdf,
        from: query.from,
        to: query.to,
        status: query.status,
      }),
    );
  }

  @Get("referrals")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  @ApiQuery({ name: "patientId", required: false })
  @ApiQuery({ name: "toDoctorId", required: false })
  @ApiQuery({ name: "from", required: false })
  @ApiQuery({ name: "to", required: false })
  async referrals(
    @CurrentUser() user: AuthUser,
    @Query() query: ReferralsReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportReferrals({
        clinicId: user.clinicId,
        format: query.format ?? ReportFormatDto.pdf,
        patientId: query.patientId,
        toDoctorId: query.toDoctorId,
        from: query.from,
        to: query.to,
      }),
    );
  }

  @Get("finance")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  @ApiQuery({ name: "from", required: false })
  @ApiQuery({ name: "to", required: false })
  async finance(
    @CurrentUser() user: AuthUser,
    @Query() query: FinanceReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportFinance({
        clinicId: user.clinicId,
        format: query.format ?? ReportFormatDto.pdf,
        from: query.from,
        to: query.to,
      }),
    );
  }
}
