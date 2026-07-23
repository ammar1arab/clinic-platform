import { IsString, IsOptional, IsEmail, IsEnum } from "class-validator";

export enum CalendarViewDto {
  day = "day",
  week = "week",
}

export enum ClinicSessionTypeDto {
  in_person = "in_person",
  online = "online",
}

export class CreateClinicDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nameAr?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  letterheadFooter?: string;

  @IsOptional()
  @IsString()
  workingHoursStart?: string;

  @IsOptional()
  @IsString()
  workingHoursEnd?: string;

  @IsOptional()
  @IsEnum(CalendarViewDto)
  defaultCalendarView?: CalendarViewDto;

  @IsOptional()
  @IsEnum(ClinicSessionTypeDto)
  defaultSessionType?: ClinicSessionTypeDto;

  @IsOptional()
  @IsString()
  defaultDepartmentId?: string;

  /** IANA timezone e.g. Asia/Riyadh */
  @IsOptional()
  @IsString()
  timezone?: string;
}
