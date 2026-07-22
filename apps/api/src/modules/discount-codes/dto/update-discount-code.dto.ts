import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { DiscountTypeDto } from '@/modules/appointments/dto/create-appointment.dto';

export class UpdateDiscountCodeDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(DiscountTypeDto)
  discountType?: DiscountTypeDto;

  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string | null;

  @IsOptional()
  @IsDateString()
  validTo?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidateDiscountCodeDto {
  @IsString()
  clinicId: string;

  @IsString()
  code: string;
}
