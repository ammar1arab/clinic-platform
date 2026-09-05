import { IsEmail, IsString, MaxLength } from "class-validator";
import { Transform } from "class-transformer";

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  @MaxLength(128)
  password: string;
}
