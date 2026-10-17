import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import type { PractitionerSelfProfileInput } from "@clinic/types";

export class SelfProfileDto implements PractitionerSelfProfileInput {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  nameAr?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bioAr?: string | null;
}
