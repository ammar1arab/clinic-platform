import { IsString, IsOptional, IsInt, IsNumber, Min } from "class-validator";

export class EnrollPatientPackageDto {
  @IsString()
  patientId: string;

  @IsString()
  packageId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sessionsTotal?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditTotal?: number | null;

  @IsOptional()
  @IsString()
  notes?: string;
}
