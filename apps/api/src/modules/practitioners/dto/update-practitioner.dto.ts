import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { EmploymentType } from "@prisma/client";
import { AvailabilitySlotDto, TimeOffEntryDto } from "./create-practitioner.dto";

export class UpdatePractitionerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameAr?: string | null;

  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  whatsapp?: string | null;

  @IsOptional()
  @IsString()
  nationality?: string | null;

  @IsOptional()
  @IsString()
  specialty?: string | null;

  @IsOptional()
  @IsString()
  specialtyAr?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  dob?: string | null;

  @IsOptional()
  @IsString()
  gender?: string | null;

  @IsOptional()
  @IsString()
  bio?: string | null;

  @IsOptional()
  @IsString()
  bioAr?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(80)
  experienceYears?: number | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  licenseNumber?: string | null;

  @IsOptional()
  @IsString()
  licenseExpiry?: string | null;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ValidateIf((_, v) => v != null && v !== "")
  @IsUUID()
  defaultRoomId?: string | null;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  commissionPercent?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  bufferMins?: number;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availabilities?: AvailabilitySlotDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeOffEntryDto)
  timeOffs?: TimeOffEntryDto[];
}

export class AssignServicesDto {
  @IsArray()
  @IsUUID("4", { each: true })
  serviceIds: string[];
}

export class ReplaceAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availabilities: AvailabilitySlotDto[];
}

export class ReplaceTimeOffDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeOffEntryDto)
  timeOffs: TimeOffEntryDto[];
}
