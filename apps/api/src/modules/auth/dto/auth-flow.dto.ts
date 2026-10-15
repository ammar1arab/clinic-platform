import { Transform } from "class-transformer";
import {
  IsEmail,
  ValidateIf,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import type {
  OwnerResetPasswordInput,
  AuthForgotInput,
  AuthPasswordInput,
  AuthTokenInput,
  AuthVerifyInput,
} from "@clinic/types";

export class ForgotPasswordDto implements AuthForgotInput {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;
}
export class AuthTokenDto implements AuthTokenInput {
  @IsString()
  @MaxLength(4096)
  @MinLength(1)
  token: string;
}
export class VerifyOtpDto extends AuthTokenDto implements AuthVerifyInput {
  @Matches(/^\d{6}$/)
  code: string;
}
export class AuthPasswordDto extends AuthTokenDto implements AuthPasswordInput {
  @IsString()
  @MinLength(1)
  password: string;
}

export class OwnerResetPasswordDto implements OwnerResetPasswordInput {
  @IsString()
  @MinLength(1)
  password: string;
}

export class AccountProfileDto {
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(120)
  nameAr?: string;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(40)
  phone?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(1_500_000)
  @Matches(
    /^(?:|https:\/\/[^\s]+|data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+)$/,
  )
  imageUrl: string;
}
