import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
} from "class-validator";
import type { CreateAppointmentInput } from "@clinic/types";

export enum SessionTypeDto {
  in_person = "in_person",
  online = "online",
}

export enum DiscountTypeDto {
  fixed = "fixed",
  percentage = "percentage",
}

export class CreateAppointmentDto implements CreateAppointmentInput {
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
