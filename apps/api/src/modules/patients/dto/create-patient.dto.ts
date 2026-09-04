import { IsString, IsOptional, IsEmail, IsDateString, IsUUID } from "class-validator";
import type { CreatePatientInput } from '@clinic/types';

export class CreatePatientDto implements CreatePatientInput {
  @IsUUID()
  clinicId: string;

  @IsString()
  firstNameEn: string;

  @IsString()
  lastNameEn: string;

  @IsOptional()
  @IsString()
  firstNameAr?: string;

  @IsOptional()
  @IsString()
  lastNameAr?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  packageId?: string | null;

  @IsOptional()
  @IsString()
  discountCodeId?: string | null;
}
