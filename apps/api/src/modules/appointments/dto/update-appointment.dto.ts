import { IsOptional, IsString, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { SessionTypeDto, DiscountTypeDto } from './create-appointment.dto';

export enum AppointmentStatusDto {
  unconfirmed = 'unconfirmed',
  confirmed = 'confirmed',
  checked_in = 'checked_in',
  waiting = 'waiting',
  in_progress = 'in_progress',
  completed = 'completed',
  no_show = 'no_show',
  cancelled = 'cancelled',
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsNumber()
  durationMins?: number;

  @IsOptional()
  @IsEnum(SessionTypeDto)
  sessionType?: SessionTypeDto;

  @IsOptional()
  @IsEnum(AppointmentStatusDto)
  status?: AppointmentStatusDto;

  @IsOptional()
  @IsString()
  cancelReason?: string;

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
  discountCodeId?: string | null;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  statusReason?: string;
}