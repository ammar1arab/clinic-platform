import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TokenService } from "./services/token.service";
import { RateLimitService } from "./services/rate-limit.service";
import { OtpService } from "./services/otp.service";
import { PasswordPolicyService } from "./services/password-policy.service";

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  providers: [
    TokenService,
    RateLimitService,
    OtpService,
    PasswordPolicyService,
  ],
  exports: [TokenService, RateLimitService, OtpService, PasswordPolicyService],
})
export class SecurityModule {}
