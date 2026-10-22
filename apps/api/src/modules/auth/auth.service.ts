import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { AuthOtpPurpose, Role, Prisma } from "@prisma/client";
import type {
  AccountProfileInput,
  AuthLoginResponse,
  AuthMe,
  AuthRecovery,
  AuthVerifyResponse,
  AuthReady,
} from "@clinic/types";
import { AuthRepository, type AuthAccount } from "./auth.repository";
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

type Account = AuthAccount;
export type AuthSessionReady = AuthReady & { accessToken: string };

const GUEST_EMAIL = "guest@clinic.invalid";
const dummyHashReady = bcrypt.hash(randomUUID(), 10);
function compareDummy(password: string) {
  return dummyHashReady.then((hash) => bcrypt.compare(password, hash));
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly tokens: TokenService,
    private readonly otp: OtpService,
    private readonly passwords: PasswordPolicyService,
    private readonly limits: RateLimitService,
  ) {}

  async updateProfile(actor: AuthUser, input: AccountProfileInput) {
    await this.limits.consume("account-profile", actor.userId, 20, 3600);
    try {
      const result = await this.repo.updateProfile(
        actor.clinicUserId,
        actor.clinicId,
        input,
      );
      if (!result.count) securityError("invalidRequest", 409);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        securityError("emailInUse", 409);
      throw error;
    }
    return this.getMe(actor.userId, actor.clinicUserId);
  }

  async requestEmailChange(actor: AuthUser, email: string) {
    await this.limits.consume("account-email", actor.userId, 5, 3600);
    const next = email.trim().toLowerCase();
    const user = await this.repo.byId(actor.userId);
    if (!user || user.id !== actor.userId) securityError("invalidToken", 401);
    this.membership(user);
    if (next === user.email) return { next: "unchanged" as const };
    if (await this.repo.byEmail(next)) securityError("emailInUse", 409);
    return this.emailChangeChallenge(user, next);
  }

  async confirmEmailChange(actor: AuthUser, token: string, code: string) {
    const payload = this.tokens.verify(token, ["email_change"]);
    if (payload.sub !== actor.userId || !payload.challengeId || !payload.email)
      securityError("invalidToken", 401);
    const challenge = await this.otp.consume(
      payload.challengeId,
      actor.userId,
      AuthOtpPurpose.EMAIL_VERIFY,
      code,
    );
    if (challenge.email !== payload.email) securityError("invalidOtp");
    const existing = await this.repo.byEmail(payload.email);
    if (existing && existing.id !== actor.userId)
      securityError("emailInUse", 409);
    if (
      !(await this.repo.changeEmail(
        actor.userId,
        payload.email,
        payload.passwordVersion,
      ))
    )
      securityError("invalidToken", 401);
    return { success: true as const };
  }

  private async emailChangeChallenge(user: Account, email: string) {
    const challengeId = await this.otp.send(
      email,
      user.id,
      AuthOtpPurpose.EMAIL_VERIFY,
    );
    return {
      next: "otp" as const,
      email,
      cooldownSeconds: AUTH_POLICY.resendSeconds,
      token: this.tokens.sign({
        ...this.payload(user),
        purpose: "email_change",
        challengeId,
        email,
      }),
    };
  }

  async ownerGenerateOtp(actor: AuthUser, id: string) {
    if (actor.role !== Role.owner) securityError("clinicUnavailable", 403);
    await this.limits.consume("owner-otp", actor.userId, 10, 3600);
    const owner = await this.repo.clinicOwner(actor.clinicId);
    if (!owner || owner.id !== actor.userId)
      securityError("clinicUnavailable", 403);
    const challenge = await this.createOwnerPasswordChallenge(
      actor.clinicId,
      id,
      true,
    );
    if (!challenge.code) securityError("invalidToken", 401);
    return { code: challenge.code, expiresAt: challenge.expiresAt };
  }

  private async createOwnerPasswordChallenge(
    clinicId: string,
    id: string,
    forceNewCode = false,
  ) {
    const target = await this.repo.otpAccount(id, clinicId);
    if (!target) securityError("invalidRequest", 404);
    const owner = await this.repo.clinicOwner(clinicId);
    const ownerName = owner?.clinicUsers[0]?.name || owner?.email;
    if (!owner || !ownerName) securityError("clinicUnavailable", 403);
    const pending = forceNewCode
      ? null
      : await this.otp.findPendingPasswordReset(
          target.id,
          target.passwordChangedAt,
        );
    const challenge = pending
      ? {
          id: pending.id,
          expiresAt: pending.expiresAt.toISOString(),
          code: undefined,
        }
      : await this.otp.issuePasswordReset(
          target.id,
          owner.email,
          clinicId,
          ownerName,
          target.passwordChangedAt,
        );
    const token = this.tokens.sign({
      sub: target.id,
      passwordVersion: target.passwordChangedAt?.getTime() ?? 0,
      purpose: "password_change",
      challengeId: challenge.id,
      email: owner.email,
      clinicUserId: id,
      clinicId,
    });
    return { ...challenge, token, email: owner.email };
  }

  async requestOwnerPasswordChange(actor: AuthUser, id: string) {
    if (actor.role !== Role.owner) securityError("clinicUnavailable", 403);
    const owner = await this.repo.clinicOwner(actor.clinicId);
    if (!owner || owner.id !== actor.userId)
      securityError("clinicUnavailable", 403);
    await this.limits.consume("account-password-reset", actor.userId, 10, 3600);
    const challenge = await this.createOwnerPasswordChallenge(
      actor.clinicId,
      id,
    );
    return {
      next: "otp" as const,
      token: challenge.token,
      email: challenge.email,
      cooldownSeconds: AUTH_POLICY.resendSeconds,
    };
  }

  async confirmOwnerPasswordChange(
    actor: AuthUser,
    id: string,
    token: string,
    code: string,
    password: string,
  ) {
    if (actor.role !== Role.owner) securityError("clinicUnavailable", 403);
    const payload = this.tokens.verify(token, ["password_change"]);
    if (
      payload.clinicId !== actor.clinicId ||
      payload.clinicUserId !== id ||
      !payload.challengeId
    ) securityError("invalidToken", 401);
    const target = await this.repo.otpAccount(id, actor.clinicId);
    if (!target || target.id !== payload.sub) securityError("invalidToken", 401);
    const owner = await this.repo.clinicOwner(actor.clinicId);
    if (!owner || owner.id !== actor.userId || owner.email !== payload.email)
      securityError("invalidToken", 401);
    const account = await this.account(payload);
    const challenge = await this.otp.consume(
      payload.challengeId,
      account.id,
      AuthOtpPurpose.FORGOT_PASSWORD,
      code,
    );
    if (challenge.email !== owner.email) securityError("invalidOtp");
    const changed = await this.repo.changePassword(
      account.id,
      account.passwordChangedAt,
      await this.passwords.hash(password),
    );
    if (!changed) securityError("invalidToken", 401);
    return { success: true as const };
  }

  private async passwordChangeChallenge(user: Account) {
    const challengeId = await this.otp.send(
      user.email,
      user.id,
      AuthOtpPurpose.FORGOT_PASSWORD,
    );
    return {
      next: "otp" as const,
      cooldownSeconds: AUTH_POLICY.resendSeconds,
      email: user.email,
      token: this.tokens.sign({
        ...this.payload(user),
        purpose: "password_change",
        challengeId,
        email: user.email,
      }),
    };
  }

  async requestPasswordChange(actor: AuthUser) {
    await this.limits.consume("account-password", actor.userId, 5, 3600);
    const user = await this.repo.byId(actor.userId);
    if (!user || user.id !== actor.userId) securityError("invalidToken", 401);
    this.membership(user);
    return this.passwordChangeChallenge(user);
  }

  async confirmPasswordChange(
    actor: AuthUser,
    token: string,
    code: string,
    password: string,
  ) {
    const payload = this.tokens.verify(token, ["password_change"]);
    if (payload.sub !== actor.userId || !payload.challengeId)
      securityError("invalidToken", 401);
    const user = await this.account(payload);
    const challenge = await this.otp.consume(
      payload.challengeId,
      actor.userId,
      AuthOtpPurpose.FORGOT_PASSWORD,
      code,
    );
    if (challenge.email !== user.email) securityError("invalidOtp");
    const hash = await this.passwords.hash(password);
    if (!(await this.repo.changePassword(user.id, user.passwordChangedAt, hash)))
      securityError("invalidToken", 401);
    return { success: true as const };
  }

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

  private toMe(user: Account, clinicUserId?: string): AuthMe {
    const member = this.membership(user);
    if (clinicUserId && member.id !== clinicUserId)
      securityError("invalidToken", 401);
    return {
      userId: user.id,
      clinicUserId: member.id,
      role: member.role,
      name: member.name,
      imageUrl: member.imageUrl,
      nameAr: member.nameAr,
      phone: member.phone,
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

  private async ready(user: Account): Promise<AuthSessionReady> {
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
      user: this.toMe(user, member.id),
    };
  }

  private setup(user: Account) {
    return {
      next: "set_password" as const,
      email: user.email,
      setupToken: this.tokens.sign({ ...this.payload(user), purpose: "setup" }),
    };
  }

  async login(
    dto: LoginDto,
  ): Promise<AuthLoginResponse | AuthSessionReady> {
    const email = dto.email.trim().toLowerCase();
    const [, user] = await Promise.all([
      this.limits.consume("login-email", email, 10, 900),
      this.repo.byEmail(email),
    ]);
    const matches = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : await compareDummy(dto.password);
    if (!user || !matches) securityError("invalidCredentials", 401);
    this.membership(user);
    if (!user.emailVerifiedAt) {
      const challengeId =
        (await this.otp.pendingId(
          user.id,
          AuthOtpPurpose.EMAIL_VERIFY,
          user.passwordChangedAt,
        )) ??
        (await this.otp.send(email, user.id, AuthOtpPurpose.EMAIL_VERIFY));
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

  async guest(): Promise<AuthSessionReady> {
    const user = await this.repo.openGuest(
      GUEST_EMAIL,
      await bcrypt.hash(randomUUID(), 10),
    );
    if (!user) securityError("guestUnavailable", 503);
    return this.ready(user);
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

  async forgot(email: string, forceNewCode = false): Promise<AuthRecovery> {
    const user = await this.repo.byEmail(email);
    const eligible = user?.clinicUsers.length === 1 ? user : null;
    if (!eligible) {
      const challengeId = await this.otp.send(
        email,
        null,
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
    const member = this.membership(eligible);
    const owner = await this.repo.clinicOwner(member.clinicId);
    if (!owner) securityError("emailUnavailable", 503);
    const pending = await this.otp.findPendingPasswordReset(
      eligible.id,
      eligible.passwordChangedAt,
    );
    const challenge = pending && !forceNewCode
      ? { id: pending.id, email: owner.email }
      : await this.createOwnerPasswordChallenge(
          member.clinicId,
          member.id,
          forceNewCode,
        );
    return {
      next: "otp",
      email: challenge.email,
      cooldownSeconds: AUTH_POLICY.resendSeconds,
      recoveryToken: this.tokens.sign({
        sub: eligible.id,
        passwordVersion: eligible.passwordChangedAt?.getTime() ?? 0,
        purpose: "recovery",
        challengeId: challenge.id,
        email,
      }),
    };
  }

  async resend(token: string) {
    const payload = this.tokens.verify(token, ["setup", "recovery", "email_change", "password_change"]);
    if (!payload.challengeId || !payload.email)
      securityError("invalidToken", 401);
    if (payload.purpose === "password_change") {
      if (payload.clinicId && payload.clinicUserId) {
        const target = await this.repo.otpAccount(
          payload.clinicUserId,
          payload.clinicId,
        );
        const owner = await this.repo.clinicOwner(payload.clinicId);
        if (
          !target ||
          target.id !== payload.sub ||
          !owner ||
          owner.email !== payload.email
        ) securityError("invalidToken", 401);
        const challenge = await this.createOwnerPasswordChallenge(
          payload.clinicId,
          payload.clinicUserId,
          true,
        );
        return {
          next: "otp" as const,
          token: challenge.token,
          email: challenge.email,
          cooldownSeconds: AUTH_POLICY.resendSeconds,
        };
      }
      const user = await this.account(payload);
      return this.passwordChangeChallenge(user);
    }
    if (payload.purpose === "email_change") {
      const user = await this.repo.byId(payload.sub);
      if (
        !user ||
        (user.passwordChangedAt?.getTime() ?? 0) !== payload.passwordVersion
      )
        securityError("invalidToken", 401);
      if (await this.repo.byEmail(payload.email)) securityError("emailInUse", 409);
      return this.emailChangeChallenge(user, payload.email);
    }
    if (payload.purpose === "recovery") return this.forgot(payload.email, true);
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

  async verify(
    dto: VerifyOtpDto,
  ): Promise<AuthVerifyResponse | AuthSessionReady> {
    const payload = this.tokens.verify(dto.token, ["setup", "recovery"]);
    if (!payload.challengeId) securityError("invalidToken", 401);
    const expectedUserId =
      payload.purpose === "setup"
        ? payload.sub
        : payload.sub === payload.challengeId
          ? undefined
          : payload.sub;
    const challenge = await this.otp.consume(
      payload.challengeId,
      expectedUserId,
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
      const owner = await this.repo.clinicOwner(user.clinicUsers[0].clinicId);
      if (owner && challenge.email !== owner.email) securityError("invalidOtp");
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

  async setPassword(
    dto: AuthPasswordDto,
    reset = false,
  ): Promise<AuthSessionReady> {
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

  async getMe(userId: string, clinicUserId: string, account?: Account) {
    const user = account ?? (await this.repo.byId(userId));
    if (!user || user.id !== userId) securityError("invalidToken", 401);
    return this.toMe(user, clinicUserId);
  }
}
