import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoomDto {
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
  @IsBoolean()
  isActive?: boolean;
}