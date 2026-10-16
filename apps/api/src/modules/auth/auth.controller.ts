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
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { ApiBearerAuth } from "@nestjs/swagger";
import { AuthService, type AuthSessionReady } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";
import {
  AccountProfileDto,
  ConfirmEmailChangeDto,
  ConfirmPasswordChangeDto,
  EmailChangeDto,
  AuthPasswordDto,
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
import { clearAuthCookie, setAuthCookie } from "@/security/auth-cookie";
import type { AuthLoginResponse, AuthVerifyResponse } from "@clinic/types";

@Controller("auth")
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private completeSession(
    result: AuthLoginResponse | AuthVerifyResponse | AuthSessionReady,
    response: Response,
  ) {
    if (result.next !== "ready") return result;
    const { accessToken, ...body } = result as AuthSessionReady;
    setAuthCookie(response, accessToken);
    return body;
  }

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

  @Post("profile/password")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.owner)
  requestPasswordChange(@CurrentUser() actor: AuthUser) {
    return this.authService.requestPasswordChange(actor);
  }

  @Post("profile/password/confirm")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.owner)
  confirmPasswordChange(
    @CurrentUser() actor: AuthUser,
    @Body() dto: ConfirmPasswordChangeDto,
  ) {
    return this.authService.confirmPasswordChange(
      actor,
      dto.token,
      dto.code,
      dto.password,
    );
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
  @Header("Cache-Control", "no-store")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.owner)
  requestOwnerPasswordChange(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.authService.requestOwnerPasswordChange(actor, id);
  }

  @Post("accounts/:id/reset-password/confirm")
  @Header("Cache-Control", "no-store")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.owner)
  confirmOwnerPasswordChange(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ConfirmPasswordChangeDto,
  ) {
    return this.authService.confirmOwnerPasswordChange(
      actor,
      id,
      dto.token,
      dto.code,
      dto.password,
    );
  }

  @Post("register")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AuthRateLimitGuard)
  register(@Body() dto: RegisterDto, @CurrentUser() actor: AuthUser) {
    return this.authService.register(dto, actor);
  }

  @Post("login")
  @Header("Cache-Control", "no-store")
  @UseGuards(AuthRateLimitGuard)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.completeSession(await this.authService.login(dto), res);
  }

  @Post("guest")
  @Header("Cache-Control", "no-store")
  @UseGuards(AuthRateLimitGuard)
  async guest(@Res({ passthrough: true }) res: Response) {
    return this.completeSession(await this.authService.guest(), res);
  }

  @Post("send-otp")
  @Header("Cache-Control", "no-store")
  @UseGuards(AuthRateLimitGuard)
  resend(@Body() dto: AuthTokenDto) {
    return this.authService.resend(dto.token);
  }

  @Post("verify-otp")
  @Header("Cache-Control", "no-store")
  @UseGuards(AuthRateLimitGuard)
  async verify(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.completeSession(await this.authService.verify(dto), res);
  }

  @Post("forgot-password")
  @Header("Cache-Control", "no-store")
  @UseGuards(AuthRateLimitGuard)
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgot(dto.email);
  }

  @Post("set-password")
  @Header("Cache-Control", "no-store")
  @UseGuards(AuthRateLimitGuard)
  async setPassword(
    @Body() dto: AuthPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.completeSession(await this.authService.setPassword(dto), res);
  }

  @Post("reset-password")
  @Header("Cache-Control", "no-store")
  @UseGuards(AuthRateLimitGuard)
  async resetPassword(
    @Body() dto: AuthPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.completeSession(
      await this.authService.setPassword(dto, true),
      res,
    );
  }

  @Post("logout")
  @Header("Cache-Control", "no-store")
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res);
    return { success: true as const };
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
