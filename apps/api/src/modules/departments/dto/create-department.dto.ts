import { IsString, IsOptional, IsBoolean } from "class-validator";

export class CreateDepartmentDto {
  @IsString()
  clinicId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nameAr?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
