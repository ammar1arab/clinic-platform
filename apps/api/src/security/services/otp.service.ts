import { Injectable } from "@nestjs/common";
import { AuthOtpPurpose } from "@prisma/client";
import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { PrismaService } from "@/prisma/prisma.service";
import { EmailService } from "@/infrastructure/email.service";
import { otpEmail } from "../auth-email";
import { loadEmailBrand } from "@/modules/emails/email-brand";
import { AUTH_POLICY } from "../security.constants";
import { RateLimitService } from "./rate-limit.service";
import { securityError } from "../security-error";

const UNTIL_USED = new Date("9999-12-31T00:00:00.000Z");

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly limits: RateLimitService,
  ) {}

  private demoCode(email: string) {
    const emails = (process.env.AUTH_DEMO_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase());
    return process.env.NODE_ENV !== "production" && emails.includes(email)
      ? process.env.AUTH_FIXED_OTP
      : undefined;
  }

  private hash(id: string, code: string) {
    return createHmac("sha256", process.env.JWT_SECRET!)
      .update(id + ":" + code)
      .digest("hex");
  }

  async send(email: string, userId: string | null, purpose: AuthOtpPurpose) {
    await this.limits.consume(
      "otp-send-hour",
      email,
      AUTH_POLICY.maxSendsPerHour,
      3600,
    );
    await this.limits.consume(
      "otp-send-cooldown",
      email,
      1,
      AUTH_POLICY.resendSeconds,
    );
    const demo = this.demoCode(email);
    if (!this.email.isEnabled && !demo) securityError("emailUnavailable", 503);
    const id = randomUUID();
    const code =
      demo ??
      randomInt(0, 1_000_000).toString().padStart(AUTH_POLICY.otpDigits, "0");
    await this.prisma.$transaction(async (tx) => {
      await tx.authOtpChallenge.updateMany({
        where: { email, purpose, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.authOtpChallenge.create({
        data: {
          id,
          email,
          userId,
          purpose,
          codeHash: this.hash(id, code),
          createdAt: new Date(),
          expiresAt: new Date(
            Date.now() + AUTH_POLICY.otpExpiresSeconds * 1000,
          ),
        },
      });
    });
    if (userId && !demo) {
      try {
        const member = await this.prisma.clinicUser.findFirst({
          where: { userId, isActive: true, clinic: { isActive: true } },
          select: { clinicId: true, name: true },
        });
        const brand = member
          ? await loadEmailBrand(this.prisma, member.clinicId)
          : null;
        if (!member || !brand) securityError("emailUnavailable", 503);
        const result = await this.email.send({
          to: email,
          ...otpEmail(code, brand, member.name),
        });
        if (result.skipped) throw new Error("Email unavailable");
      } catch {
        await this.prisma.authOtpChallenge.update({
          where: { id },
          data: { usedAt: new Date() },
        });
        if (purpose !== AuthOtpPurpose.FORGOT_PASSWORD)
          securityError("emailUnavailable", 503);
      }
    }
    return id;
  }

  pendingId(
    userId: string,
    purpose: AuthOtpPurpose,
    passwordChangedAt: Date | null,
  ) {
    return this.prisma.authOtpChallenge
      .findFirst({
        where: {
          userId,
          purpose,
          usedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: AUTH_POLICY.maxOtpAttempts },
          ...(passwordChangedAt && { createdAt: { gt: passwordChangedAt } }),
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
      .then((challenge) => challenge?.id ?? null);
  }

  findPendingPasswordReset(userId: string, passwordChangedAt: Date | null) {
    return this.prisma.authOtpChallenge.findFirst({
      where: {
        userId,
        purpose: AuthOtpPurpose.FORGOT_PASSWORD,
        usedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: AUTH_POLICY.maxOtpAttempts },
        ...(passwordChangedAt && { createdAt: { gt: passwordChangedAt } }),
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, expiresAt: true },
    });
  }

  async issuePasswordReset(
    userId: string,
    recipientEmail: string,
    clinicId: string,
    recipientName: string,
    passwordChangedAt: Date | null,
  ) {
    await this.limits.consume("owner-otp-target", userId, 5, 3600);
    await this.limits.consume(
      "otp-send-hour",
      recipientEmail,
      AUTH_POLICY.maxSendsPerHour,
      3600,
    );
    await this.limits.consume(
      "otp-send-cooldown",
      recipientEmail,
      1,
      AUTH_POLICY.resendSeconds,
    );

    const id = randomUUID();
    const code = randomInt(0, 1_000_000)
      .toString()
      .padStart(AUTH_POLICY.otpDigits, "0");
    const expiresAt = new Date(
      Date.now() + AUTH_POLICY.otpExpiresSeconds * 1000,
    );
    await this.prisma.$transaction(async (tx) => {
      await tx.authOtpChallenge.updateMany({
        where: {
          userId,
          purpose: AuthOtpPurpose.FORGOT_PASSWORD,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
      await tx.authOtpChallenge.create({
        data: {
          id,
          email: recipientEmail,
          userId,
          purpose: AuthOtpPurpose.FORGOT_PASSWORD,
          codeHash: this.hash(id, code),
          createdAt: new Date(),
          expiresAt,
        },
      });
    });

    try {
      const brand = await loadEmailBrand(this.prisma, clinicId);
      if (!brand || !this.email.isEnabled)
        securityError("emailUnavailable", 503);
      const result = await this.email.send({
        to: recipientEmail,
        ...otpEmail(code, brand, recipientName),
      });
      if (result.skipped) throw new Error("Email unavailable");
    } catch {
      await this.prisma.authOtpChallenge.update({
        where: { id },
        data: { usedAt: new Date() },
      });
      securityError("emailUnavailable", 503);
    }

    return { id, code, expiresAt: expiresAt.toISOString() };
  }

  async issue(
    userId: string,
    email: string,
    passwordChangedAt: Date | null,
    _clinicId: string,
  ) {
    await this.limits.consume("owner-otp-target", userId, 5, 3600);
    const challenge = await this.prisma.authOtpChallenge.findFirst({
      where: {
        userId,
        purpose: AuthOtpPurpose.EMAIL_VERIFY,
        usedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: AUTH_POLICY.maxOtpAttempts },
        ...(passwordChangedAt && { createdAt: { gt: passwordChangedAt } }),
      },
      orderBy: { createdAt: "desc" },
    });
    if (!challenge) {
      const id = randomUUID();
      const code = randomInt(0, 1_000_000)
        .toString()
        .padStart(AUTH_POLICY.otpDigits, "0");
      await this.prisma.authOtpChallenge.create({
        data: {
          id,
          email,
          userId,
          purpose: AuthOtpPurpose.EMAIL_VERIFY,
          codeHash: this.hash(id, code),
          expiresAt: UNTIL_USED,
        },
      });
      return { code, expiresAt: UNTIL_USED.toISOString() };
    }
    const code = randomInt(0, 1_000_000)
      .toString()
      .padStart(AUTH_POLICY.otpDigits, "0");
    const updated = await this.prisma.authOtpChallenge.updateMany({
      where: {
        id: challenge.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { codeHash: this.hash(challenge.id, code), expiresAt: UNTIL_USED },
    });
    if (updated.count) return { code, expiresAt: UNTIL_USED.toISOString() };
    const id = randomUUID();
    const fresh = randomInt(0, 1_000_000)
      .toString()
      .padStart(AUTH_POLICY.otpDigits, "0");
    await this.prisma.authOtpChallenge.create({
      data: {
        id,
        email,
        userId,
        purpose: AuthOtpPurpose.EMAIL_VERIFY,
        codeHash: this.hash(id, fresh),
        expiresAt: UNTIL_USED,
      },
    });
    return { code: fresh, expiresAt: UNTIL_USED.toISOString() };
  }

  async consume(
    id: string,
    userId: string | undefined,
    purpose: AuthOtpPurpose,
    code: string,
  ) {
    const claimed = await this.prisma.authOtpChallenge.updateMany({
      where: {
        id,
        userId: userId ?? { not: null },
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: AUTH_POLICY.maxOtpAttempts },
      },
      data: { attempts: { increment: 1 } },
    });
    if (!claimed.count) securityError("invalidOtp");
    const challenge = await this.prisma.authOtpChallenge.findUniqueOrThrow({
      where: { id },
    });
    if (
      !timingSafeEqual(
        Buffer.from(challenge.codeHash, "hex"),
        Buffer.from(this.hash(id, code), "hex"),
      )
    )
      securityError("invalidOtp");
    const consumed = await this.prisma.authOtpChallenge.updateMany({
      where: {
        id,
        codeHash: challenge.codeHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });
    if (!consumed.count) securityError("invalidOtp");
    return {
      userId: challenge.userId!,
      email: challenge.email,
      createdAt: challenge.createdAt,
    };
  }
}
