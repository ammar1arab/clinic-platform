import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  clinicId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
