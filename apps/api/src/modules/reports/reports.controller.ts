import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiProduces, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { Roles } from "@/modules/auth/decorators";
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
} from "./dto";
import type { ExportedReport } from "./exporters/report-exporter";

const PRODUCES = [
  "application/pdf",
  "application/vnd.ms-excel",
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

  @Get("patients/:patientId")
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async patientMedical(
    @Param("patientId") patientId: string,
    @Query() query: PatientReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPatientMedical(
        query.clinicId,
        patientId,
        query.format ?? ReportFormatDto.pdf,
      ),
    );
  }

  @Get("patients-directory")
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async patientsDirectory(
    @Query() query: DirectoryReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPatientsDirectory(query),
    );
  }

  @Get("practitioners-directory")
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async practitionersDirectory(
    @Query() query: DirectoryReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPractitionersDirectory(query),
    );
  }

  @Get("practitioners/:practitionerId/appointments")
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async practitionerAppointments(
    @Param("practitionerId") practitionerId: string,
    @Query() query: PractitionerScopedReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPractitionerAppointments({
        clinicId: query.clinicId,
        practitionerId,
        format: query.format ?? ReportFormatDto.pdf,
        from: query.from,
        to: query.to,
      }),
    );
  }

  @Get("practitioners/:practitionerId/hours")
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async practitionerHours(
    @Param("practitionerId") practitionerId: string,
    @Query() query: PractitionerScopedReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPractitionerHours(
        query.clinicId,
        practitionerId,
        query.format ?? ReportFormatDto.pdf,
      ),
    );
  }

  @Get("practitioners/:practitionerId/exceptions")
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async practitionerExceptions(
    @Param("practitionerId") practitionerId: string,
    @Query() query: PractitionerScopedReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPractitionerExceptions(
        query.clinicId,
        practitionerId,
        query.format ?? ReportFormatDto.pdf,
      ),
    );
  }

  @Get("practitioners/:practitionerId")
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async practitionerProfile(
    @Param("practitionerId") practitionerId: string,
    @Query() query: PractitionerScopedReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportPractitionerProfile(
        query.clinicId,
        practitionerId,
        query.format ?? ReportFormatDto.pdf,
      ),
    );
  }

  @Get("appointments")
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  async clinicAppointments(
    @Query() query: ClinicAppointmentsReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportClinicAppointments({
        clinicId: query.clinicId,
        format: query.format ?? ReportFormatDto.pdf,
        from: query.from,
        to: query.to,
        status: query.status,
      }),
    );
  }

  @Get("referrals")
  @ApiProduces(...PRODUCES)
  @ApiQuery({ name: "clinicId", required: true })
  @ApiQuery({ name: "format", required: false, enum: ReportFormatDto })
  @ApiQuery({ name: "patientId", required: false })
  @ApiQuery({ name: "toDoctorId", required: false })
  @ApiQuery({ name: "from", required: false })
  @ApiQuery({ name: "to", required: false })
  async referrals(
    @Query() query: ReferralsReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportReferrals({
        clinicId: query.clinicId,
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
    @Query() query: FinanceReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return sendExport(
      res,
      await this.reportsService.exportFinance({
        clinicId: query.clinicId,
        format: query.format ?? ReportFormatDto.pdf,
        from: query.from,
        to: query.to,
      }),
    );
  }
}
