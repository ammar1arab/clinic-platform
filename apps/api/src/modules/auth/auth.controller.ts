import { Body, Controller, Post, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto";
import { JwtAuthGuard } from "./guards";
import { CurrentUser } from "./decorators";
import type { AuthUser } from "./types";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.userId, user.clinicUserId);
  }
}
