import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdatePaymentMethodDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
