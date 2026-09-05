import { Transform } from "class-transformer";
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import type {
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
  @MaxLength(64)
  @MinLength(1)
  password: string;
}
