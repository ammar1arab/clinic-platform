import {
  Body,
  Patch,
  Header,
  Param,
  ParseUUIDPipe,
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  UseFilters,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";
import {
  AccountProfileDto,
  ConfirmEmailChangeDto,
  EmailChangeDto,
  AuthPasswordDto,
  OwnerResetPasswordDto,
  AuthTokenDto,
  ForgotPasswordDto,
  VerifyOtpDto,
} from "./dto/auth-flow.dto";
import { Role } from "@prisma/client";
import { RolesGuard } from "./guards";
import { Roles } from "./decorators";
import { JwtAuthGuard } from "./guards";
import { CurrentUser } from "./decorators";
import type { AuthUser } from "./types";
import type { AuthRequest } from "./strategies/jwt.strategy";
import { AuthRateLimitGuard } from "@/security/guards/auth-rate-limit.guard";
import { AuthExceptionFilter } from "@/security/auth-exception.filter";

@Controller("auth")
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Patch("profile")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.owner)
  updateProfile(
    @CurrentUser() actor: AuthUser,
    @Body() dto: AccountProfileDto,
  ) {
    return this.authService.updateProfile(actor, dto);
  }

  @Post("profile/email")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.owner)
  requestEmailChange(
    @CurrentUser() actor: AuthUser,
    @Body() dto: EmailChangeDto,
  ) {
    return this.authService.requestEmailChange(actor, dto.email);
  }

  @Post("profile/email/confirm")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.owner)
  confirmEmailChange(
    @CurrentUser() actor: AuthUser,
    @Body() dto: ConfirmEmailChangeDto,
  ) {
    return this.authService.confirmEmailChange(actor, dto.token, dto.code);
  }

  @Post("accounts/:id/otp")
  @Header("Cache-Control", "no-store")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.owner)
  ownerGenerateOtp(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.authService.ownerGenerateOtp(actor, id);
  }

  @Post("accounts/:id/reset-password")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.owner)
  ownerResetPassword(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: OwnerResetPasswordDto,
  ) {
    return this.authService.ownerResetPassword(actor, id, dto.password);
  }

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

  @Post("guest")
  @UseGuards(AuthRateLimitGuard)
  guest() {
    return this.authService.guest();
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
  getMe(@CurrentUser() user: AuthUser, @Req() req: AuthRequest) {
    return this.authService.getMe(
      user.userId,
      user.clinicUserId,
      req.authAccount,
    );
  }
}
