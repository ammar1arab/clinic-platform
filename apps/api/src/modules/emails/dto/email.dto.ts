import { IntersectionType } from "@nestjs/mapped-types";
import { Type, Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  ValidateIf,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  Matches,
} from "class-validator";
import { AppointmentStatus, Role, EmailRecipientStatus } from "@prisma/client";
import {
  EMAIL_AUDIENCE,
  LOCALE,
  type EmailAudience,
  type Locale,
  type EmailTestInput,
} from "@clinic/types";

export class EmailFiltersDto {
  @IsIn([...Object.values(EMAIL_AUDIENCE), "all"])
  audience: EmailAudience | "all";

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  ids?: string[];

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(100)
  search?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsUUID()
  doctorId?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsUUID()
  departmentId?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsUUID()
  serviceId?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsEnum(AppointmentStatus, { each: true })
  appointmentStatuses?: AppointmentStatus[];

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDateString({ strict: true })
  appointmentFrom?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDateString({ strict: true })
  appointmentTo?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isPaid?: boolean;
}

export class ExternalEmailDto {
  @Transform(({ value }: { value: string }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;
}

export class EmailSelectionDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => EmailFiltersDto)
  filters?: EmailFiltersDto;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => ExternalEmailDto)
  externalRecipients?: ExternalEmailDto[];

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsEmail({}, { each: true })
  excludedEmails?: string[];
}

export class EmailContentDto {
  @IsIn([LOCALE.EN, LOCALE.AR])
  locale: Locale;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^[^\r\n]+$/)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  body: string;
}

export class SendEmailDto extends IntersectionType(
  EmailContentDto,
  EmailSelectionDto,
) {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  selectionHash: string;

  @IsUUID()
  requestId: string;
}

export class PreviewRecipientDto {
  @IsIn(Object.values(EMAIL_AUDIENCE))
  audience: EmailAudience;

  @IsUUID()
  id: string;
}

export class PreviewEmailDto extends EmailContentDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => ExternalEmailDto)
  externalRecipient?: ExternalEmailDto;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => PreviewRecipientDto)
  recipient?: PreviewRecipientDto;
}

export class TestEmailDto implements EmailTestInput {
  @IsIn([LOCALE.EN, LOCALE.AR])
  locale: Locale;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  body?: string;

  @IsUUID()
  requestId: string;
}

export class EmailPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class EmailHistoryDto extends EmailPaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(EmailRecipientStatus)
  status?: EmailRecipientStatus;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    value === "true" ? true : value === "false" ? false : value,
  )
  @IsBoolean()
  isTest?: boolean;

  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}

export class EmailSettingsDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  replyTo?: string;

  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  websiteUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  instagramUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  facebookUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  footerEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  footerAr?: string;
}
