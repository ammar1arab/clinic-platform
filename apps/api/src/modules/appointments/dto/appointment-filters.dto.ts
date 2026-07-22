import { IsString, IsOptional, IsDateString } from 'class-validator';

export class AppointmentFiltersDto {

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}