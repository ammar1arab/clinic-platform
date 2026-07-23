import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
} from "class-validator";
import { DiscountTypeDto } from "@/modules/appointments/dto/create-appointment.dto";

export class CreateDiscountCodeDto {
  @IsString()
  clinicId: string;

  @IsString()
  code: string;

  @IsEnum(DiscountTypeDto)
  discountType: DiscountTypeDto;

  @IsNumber()
  discountValue: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
