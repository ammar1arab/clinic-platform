import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { AuthOtpPurpose } from "@prisma/client";
import type {
  AuthLoginResponse,
  AuthRecovery,
  AuthVerifyResponse,
  AuthReady,
} from "@clinic/types";
import { AuthRepository } from "./auth.repository";
import { LoginDto, RegisterDto } from "./dto";
import type { AuthUser } from "./types";
import { AuthPasswordDto, VerifyOtpDto } from "./dto/auth-flow.dto";
import {
  TokenService,
  type SecurityPayload,
} from "@/security/services/token.service";
import { OtpService } from "@/security/services/otp.service";
import { PasswordPolicyService } from "@/security/services/password-policy.service";
import { RateLimitService } from "@/security/services/rate-limit.service";
import { AUTH_POLICY } from "@/security/security.constants";
import { securityError } from "@/security/security-error";

type Account = NonNullable<Awaited<ReturnType<AuthRepository["byId"]>>>;
const DUMMY_HASH = bcrypt.hashSync(randomUUID(), 12);

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly tokens: TokenService,
    private readonly otp: OtpService,
    private readonly passwords: PasswordPolicyService,
    private readonly limits: RateLimitService,
  ) {}

  private membership(user: Account) {
    if (user.clinicUsers.length !== 1) securityError("clinicUnavailable", 403);
    return user.clinicUsers[0];
  }

  async register(dto: RegisterDto, actor: AuthUser) {
    if (actor.role !== "owner" || actor.clinicId !== dto.clinicId)
      securityError("clinicUnavailable", 403);
    if (await this.repo.byEmail(dto.email.trim().toLowerCase()))
      throw new ConflictException("Email already registered");
    await this.repo.create(dto, await this.passwords.hash(dto.password));
    return { email: dto.email.trim().toLowerCase() };
  }

  private payload(
    user: Account,
  ): Pick<SecurityPayload, "sub" | "passwordVersion"> {
    return {
      sub: user.id,
      passwordVersion: user.passwordChangedAt?.getTime() ?? 0,
    };
  }

  private ready(user: Account): AuthReady {
    if (!user.emailVerifiedAt || user.mustChangePassword)
      securityError("invalidToken", 401);
    const member = this.membership(user);
    return {
      next: "ready",
      accessToken: this.tokens.sign({
        ...this.payload(user),
        purpose: "access",
        clinicId: member.clinicId,
        clinicUserId: member.id,
      }),
    };
  }

  private setup(user: Account) {
    return {
      next: "set_password" as const,
      email: user.email,
      setupToken: this.tokens.sign({ ...this.payload(user), purpose: "setup" }),
    };
  }

  async login(dto: LoginDto): Promise<AuthLoginResponse> {
    const email = dto.email.trim().toLowerCase();
    await this.limits.consume("login-email", email, 10, 900);
    const user = await this.repo.byEmail(email);
    const matches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !matches) securityError("invalidCredentials", 401);
    this.membership(user);
    if (!user.emailVerifiedAt) {
      const challengeId = await this.otp.send(
        email,
        user.id,
        AuthOtpPurpose.EMAIL_VERIFY,
      );
      return {
        next: "otp",
        email,
        cooldownSeconds: AUTH_POLICY.resendSeconds,
        setupToken: this.tokens.sign({
          ...this.payload(user),
          purpose: "setup",
          challengeId,
          email,
        }),
      };
    }
    return user.mustChangePassword ? this.setup(user) : this.ready(user);
  }

  private async account(payload: SecurityPayload) {
    const user = await this.repo.byId(payload.sub);
    if (
      !user ||
      (user.passwordChangedAt?.getTime() ?? 0) !== payload.passwordVersion
    )
      securityError("invalidToken", 401);
    this.membership(user);
    return user;
  }

  async forgot(email: string): Promise<AuthRecovery> {
    const user = await this.repo.byEmail(email);
    const eligible = user?.clinicUsers.length === 1 ? user : null;
    const challengeId = await this.otp.send(
      email,
      eligible?.id ?? null,
      AuthOtpPurpose.FORGOT_PASSWORD,
    );
    return {
      next: "otp",
      email,
      cooldownSeconds: AUTH_POLICY.resendSeconds,
      recoveryToken: this.tokens.sign({
        sub: challengeId,
        passwordVersion: 0,
        purpose: "recovery",
        challengeId,
        email,
      }),
    };
  }

  async resend(token: string) {
    const payload = this.tokens.verify(token, ["setup", "recovery"]);
    if (!payload.challengeId || !payload.email)
      securityError("invalidToken", 401);
    if (payload.purpose === "recovery") return this.forgot(payload.email);
    const user = await this.account(payload);
    if (user.emailVerifiedAt) securityError("invalidToken", 401);
    const challengeId = await this.otp.send(
      user.email,
      user.id,
      AuthOtpPurpose.EMAIL_VERIFY,
    );
    return {
      next: "otp" as const,
      email: user.email,
      cooldownSeconds: AUTH_POLICY.resendSeconds,
      setupToken: this.tokens.sign({
        ...this.payload(user),
        purpose: "setup",
        challengeId,
        email: user.email,
      }),
    };
  }

  async verify(dto: VerifyOtpDto): Promise<AuthVerifyResponse> {
    const payload = this.tokens.verify(dto.token, ["setup", "recovery"]);
    if (!payload.challengeId) securityError("invalidToken", 401);
    const challenge = await this.otp.consume(
      payload.challengeId,
      payload.purpose === "setup" ? payload.sub : undefined,
      payload.purpose === "setup"
        ? AuthOtpPurpose.EMAIL_VERIFY
        : AuthOtpPurpose.FORGOT_PASSWORD,
      dto.code,
    );
    const user =
      payload.purpose === "setup"
        ? await this.account(payload)
        : await this.repo.byId(challenge.userId);
    if (!user) securityError("invalidToken", 401);
    if (user.passwordChangedAt && challenge.createdAt <= user.passwordChangedAt)
      securityError("invalidToken", 401);
    this.membership(user);
    if (payload.purpose === "recovery") {
      return {
        next: "reset_password",
        resetToken: this.tokens.sign({
          ...this.payload(user),
          purpose: "password_reset",
        }),
      };
    }
    await this.repo.verifyEmail(user.id);
    const verified = await this.repo.byId(user.id);
    if (!verified) securityError("invalidToken", 401);
    return verified.mustChangePassword
      ? this.setup(verified)
      : this.ready(verified);
  }

  async setPassword(dto: AuthPasswordDto, reset = false): Promise<AuthReady> {
    const payload = this.tokens.verify(dto.token, [
      reset ? "password_reset" : "setup",
    ]);
    const user = await this.account(payload);
    if (!reset && (!user.emailVerifiedAt || !user.mustChangePassword))
      securityError("invalidToken", 401);
    const hash = await this.passwords.hash(dto.password);
    const changed = await this.repo.changePassword(
      user.id,
      user.passwordChangedAt,
      hash,
    );
    if (!changed) securityError("invalidToken", 401);
    return this.ready(changed);
  }

  async getMe(userId: string, clinicUserId: string) {
    const user = await this.repo.byId(userId);
    if (!user) securityError("invalidToken", 401);
    const member = this.membership(user);
    if (member.id !== clinicUserId) securityError("invalidToken", 401);
    return {
      userId,
      clinicUserId: member.id,
      role: member.role,
      name: member.name,
      email: user.email,
      clinic: {
        id: member.clinic.id,
        name: member.clinic.name,
        workingHoursStart: member.clinic.workingHoursStart,
        workingHoursEnd: member.clinic.workingHoursEnd,
        timezone: member.clinic.timezone,
      },
    };
  }
}
