import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  IsBoolean,
} from "class-validator";

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
  @IsInt()
  @Min(1)
  durationMins?: number;

  @IsNumber()
  @Min(0)
  fee: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
