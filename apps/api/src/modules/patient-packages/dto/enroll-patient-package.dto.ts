import { IsString, IsOptional, IsInt, IsNumber, Min } from "class-validator";

export class EnrollPatientPackageDto {
  @IsString()
  patientId: string;

  @IsString()
  packageId: string;

  /** Overrides the catalog session count for this purchase. */
  @IsOptional()
  @IsInt()
  @Min(1)
  sessionsTotal?: number | null;

  /** Overrides the catalog credit amount for this purchase. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditTotal?: number | null;

  @IsOptional()
  @IsString()
  notes?: string;
}
