import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
} from "class-validator";

export enum SessionTypeDto {
  in_person = "in_person",
  online = "online",
}

export enum DiscountTypeDto {
  fixed = "fixed",
  percentage = "percentage",
}

export class CreateAppointmentDto {
  @IsString()
  patientId: string;

  @IsString()
  doctorId: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsNumber()
  durationMins?: number;

  @IsOptional()
  @IsEnum(SessionTypeDto)
  sessionType?: SessionTypeDto;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  feeOverride?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsEnum(DiscountTypeDto)
  discountType?: DiscountTypeDto;

  @IsOptional()
  @IsString()
  discountReason?: string;

  @IsOptional()
  @IsString()
  discountCodeId?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;
}
