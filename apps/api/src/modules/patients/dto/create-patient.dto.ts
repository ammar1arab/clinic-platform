import { IsString, IsOptional, IsEmail, IsDateString } from 'class-validator';

export class CreatePatientDto {
  @IsString()
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
  packageId?: string | null;

  @IsOptional()
  @IsString()
  discountCodeId?: string | null;
}