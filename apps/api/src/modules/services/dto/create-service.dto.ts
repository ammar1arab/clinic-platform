import { IsString, IsOptional, IsNumber, IsBoolean } from "class-validator";

export class CreateServiceDto {
  @IsString()
  clinicId: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nameAr?: string;

  @IsOptional()
  @IsNumber()
  durationMins?: number;

  @IsNumber()
  fee: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
