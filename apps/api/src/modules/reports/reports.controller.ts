import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProduces, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard, RolesGuard } from '@/modules/auth/guards';
import { Roles } from '@/modules/auth/decorators';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import {
  PatientReportQueryDto,
  ReferralsReportQueryDto,
  FinanceReportQueryDto,
  ReportFormatDto,
} from './dto';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  /**
   * Patient medical report — visit history + profile.
   * Formats: pdf | xlsx | csv
   */
  @Get('patients/:patientId')
  @ApiProduces('application/pdf', 'application/vnd.ms-excel', 'text/csv')
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiQuery({ name: 'format', required: false, enum: ReportFormatDto })
  async patientMedical(
    @Param('patientId') patientId: string,
    @Query() query: PatientReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const exported = await this.reportsService.exportPatientMedical(
      query.clinicId,
      patientId,
      query.format ?? ReportFormatDto.pdf,
    );

    res.set({
      'Content-Type': exported.contentType,
      'Content-Disposition': `attachment; filename="${exported.filename}"`,
      'Cache-Control': 'no-store',
    });

    return new StreamableFile(exported.buffer);
  }

  /**
   * Referrals & consultations report (no payment data).
   * Formats: pdf | xlsx | csv
   */
  @Get('referrals')
  @ApiProduces('application/pdf', 'application/vnd.ms-excel', 'text/csv')
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiQuery({ name: 'format', required: false, enum: ReportFormatDto })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'toDoctorId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async referrals(
    @Query() query: ReferralsReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const exported = await this.reportsService.exportReferrals({
      clinicId: query.clinicId,
      format: query.format ?? ReportFormatDto.pdf,
      patientId: query.patientId,
      toDoctorId: query.toDoctorId,
      from: query.from,
      to: query.to,
    });

    res.set({
      'Content-Type': exported.contentType,
      'Content-Disposition': `attachment; filename="${exported.filename}"`,
      'Cache-Control': 'no-store',
    });

    return new StreamableFile(exported.buffer);
  }

  /**
   * Monthly finance report — revenue, unpaid, by method / doctor.
   * Formats: pdf | xlsx | csv
   */
  @Get('finance')
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  @ApiProduces('application/pdf', 'application/vnd.ms-excel', 'text/csv')
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiQuery({ name: 'format', required: false, enum: ReportFormatDto })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async finance(
    @Query() query: FinanceReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const exported = await this.reportsService.exportFinance({
      clinicId: query.clinicId,
      format: query.format ?? ReportFormatDto.pdf,
      from: query.from,
      to: query.to,
    });

    res.set({
      'Content-Type': exported.contentType,
      'Content-Disposition': `attachment; filename="${exported.filename}"`,
      'Cache-Control': 'no-store',
    });

    return new StreamableFile(exported.buffer);
  }
}
