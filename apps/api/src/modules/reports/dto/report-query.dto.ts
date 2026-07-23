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
