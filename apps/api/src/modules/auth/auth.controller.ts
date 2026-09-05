import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  UseFilters,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";
import {
  AuthPasswordDto,
  AuthTokenDto,
  ForgotPasswordDto,
  VerifyOtpDto,
} from "./dto/auth-flow.dto";
import { JwtAuthGuard } from "./guards";
import { CurrentUser } from "./decorators";
import type { AuthUser } from "./types";
import { AuthRateLimitGuard } from "@/security/guards/auth-rate-limit.guard";
import { AuthExceptionFilter } from "@/security/auth-exception.filter";

@Controller("auth")
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AuthRateLimitGuard)
  register(@Body() dto: RegisterDto, @CurrentUser() actor: AuthUser) {
    return this.authService.register(dto, actor);
  }

  @Post("login")
  @UseGuards(AuthRateLimitGuard)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("send-otp")
  @UseGuards(AuthRateLimitGuard)
  resend(@Body() dto: AuthTokenDto) {
    return this.authService.resend(dto.token);
  }

  @Post("verify-otp")
  @UseGuards(AuthRateLimitGuard)
  verify(@Body() dto: VerifyOtpDto) {
    return this.authService.verify(dto);
  }

  @Post("forgot-password")
  @UseGuards(AuthRateLimitGuard)
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgot(dto.email);
  }

  @Post("set-password")
  @UseGuards(AuthRateLimitGuard)
  setPassword(@Body() dto: AuthPasswordDto) {
    return this.authService.setPassword(dto);
  }

  @Post("reset-password")
  @UseGuards(AuthRateLimitGuard)
  resetPassword(@Body() dto: AuthPasswordDto) {
    return this.authService.setPassword(dto, true);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.userId, user.clinicUserId);
  }
}
