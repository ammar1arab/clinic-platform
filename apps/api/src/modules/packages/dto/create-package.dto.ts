import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
} from "class-validator";
import { DiscountTypeDto } from "@/modules/appointments/dto/create-appointment.dto";

export class CreatePackageDto {
  @IsString()
  clinicId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sessionCount?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(DiscountTypeDto)
  discountType?: DiscountTypeDto;

  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
