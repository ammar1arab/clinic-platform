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
import { AUTH_POLICY } from "../security.constants";
import { RateLimitService } from "./rate-limit.service";
import { securityError } from "../security-error";

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
        const result = await this.email.send({
          to: email,
          ...otpEmail(code),
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
      where: { id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (!consumed.count) securityError("invalidOtp");
    return { userId: challenge.userId!, createdAt: challenge.createdAt };
  }
}
