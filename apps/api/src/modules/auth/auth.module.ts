import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { SecurityModule } from "@/security/security.module";
import { AuthRateLimitGuard } from "@/security/guards/auth-rate-limit.guard";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies";

@Module({
  imports: [PassportModule, SecurityModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy, AuthRateLimitGuard],
  exports: [AuthService],
})
export class AuthModule {}
