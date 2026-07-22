import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ReferralTypeDto {
  referral = 'referral',
  consultation = 'consultation',
}

export enum ReferralUrgencyDto {
  normal = 'normal',
  high = 'high',
  urgent = 'urgent',
}

export class CreateReferralDto {
  @IsString()
  clinicId: string;

  @IsString()
  appointmentId: string;

  @IsString()
  toDoctorId: string;

  @IsEnum(ReferralTypeDto)
  type: ReferralTypeDto;

  @IsOptional()
  @IsEnum(ReferralUrgencyDto)
  urgency?: ReferralUrgencyDto;

  @IsString()
  reason: string;
}
