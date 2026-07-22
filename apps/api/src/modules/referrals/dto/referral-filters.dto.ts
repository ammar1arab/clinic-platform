import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum ReferralStatusDto {
  pending = 'pending',
  accepted = 'accepted',
  rejected = 'rejected',
}

export class ReferralFiltersDto {
  @IsString()
  clinicId: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  toDoctorId?: string;

  @IsOptional()
  @IsEnum(ReferralStatusDto)
  status?: ReferralStatusDto;
}
