import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsEnum,
  IsDateString,
} from "class-validator";
import { Transform } from "class-transformer";

export enum PatientSortBy {
  CREATED_AT = "createdAt", // newest registered
  UPDATED_AT = "updatedAt", // recently modified
  FIRST_NAME = "firstNameEn", // A-Z by first name
  LAST_NAME = "lastNameEn", // A-Z by last name
  DOB = "dob", // age (youngest / oldest)
  APPOINTMENTS = "appointments", // most total sessions
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export class PatientFiltersDto {
  @IsString()
  clinicId: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  primaryDoctorId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsDateString()
  visitFrom?: string;

  @IsOptional()
  @IsDateString()
  visitTo?: string;

  @IsOptional()
  @IsDateString()
  dobFrom?: string; // born AFTER this date e.g. "1990-01-01"

  @IsOptional()
  @IsDateString()
  dobTo?: string; // born BEFORE this date e.g. "2005-12-31"

  @IsOptional()
  @IsEnum(PatientSortBy)
  sortBy?: PatientSortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" || typeof value === "number"
      ? parseInt(String(value), 10)
      : undefined,
  )
  @IsInt()
  page?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" || typeof value === "number"
      ? parseInt(String(value), 10)
      : undefined,
  )
  @IsInt()
  limit?: number;
}
