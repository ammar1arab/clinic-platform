import { IsEnum, IsOptional, IsString, IsDateString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export enum ReportFormatDto {
  pdf = "pdf",
  xlsx = "xlsx",
  csv = "csv",
  docx = "docx",
}

export class PatientReportQueryDto {
  @IsString()
  clinicId: string;

  @ApiPropertyOptional({ enum: ReportFormatDto, default: ReportFormatDto.pdf })
  @IsOptional()
  @IsEnum(ReportFormatDto)
  format?: ReportFormatDto;
}

export class ReferralsReportQueryDto {
  @IsString()
  clinicId: string;

  @ApiPropertyOptional({ enum: ReportFormatDto, default: ReportFormatDto.pdf })
  @IsOptional()
  @IsEnum(ReportFormatDto)
  format?: ReportFormatDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toDoctorId?: string;

  @ApiPropertyOptional({ description: "ISO date e.g. 2026-01-01" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: "ISO date e.g. 2026-01-31" })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class FinanceReportQueryDto {
  @IsString()
  clinicId: string;

  @ApiPropertyOptional({ enum: ReportFormatDto, default: ReportFormatDto.pdf })
  @IsOptional()
  @IsEnum(ReportFormatDto)
  format?: ReportFormatDto;

  @ApiPropertyOptional({ description: "ISO date e.g. 2026-01-01" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: "ISO date e.g. 2026-01-31" })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class DirectoryReportQueryDto {
  @IsString()
  clinicId: string;

  @ApiPropertyOptional({ enum: ReportFormatDto, default: ReportFormatDto.pdf })
  @IsOptional()
  @IsEnum(ReportFormatDto)
  format?: ReportFormatDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  license?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryDoctorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  visitFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  visitTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dobFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dobTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortOrder?: string;
}

export class PractitionerScopedReportQueryDto {
  @IsString()
  clinicId: string;

  @ApiPropertyOptional({ enum: ReportFormatDto, default: ReportFormatDto.pdf })
  @IsOptional()
  @IsEnum(ReportFormatDto)
  format?: ReportFormatDto;

  @ApiPropertyOptional({ description: "ISO date e.g. 2026-01-01" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: "ISO date e.g. 2026-01-31" })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class ClinicAppointmentsReportQueryDto {
  @IsString()
  clinicId: string;

  @ApiPropertyOptional({ enum: ReportFormatDto, default: ReportFormatDto.pdf })
  @IsOptional()
  @IsEnum(ReportFormatDto)
  format?: ReportFormatDto;

  @ApiPropertyOptional({ description: "ISO date e.g. 2026-01-01" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: "ISO date e.g. 2026-01-31" })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
