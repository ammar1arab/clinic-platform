import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "node:crypto";
import {
  AUTH_AUDIENCE,
  AUTH_ISSUER,
  AUTH_POLICY,
  ACCESS_TOKEN_SECONDS,
} from "../security.constants";
import { securityError } from "../security-error";

export type TokenPurpose = "access" | "setup" | "recovery" | "password_reset";
export interface SecurityPayload {
  sub: string;
  purpose: TokenPurpose;
  passwordVersion: number;
  challengeId?: string;
  email?: string;
  clinicUserId?: string;
  clinicId?: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
    if (
      process.env.AUTH_FIXED_OTP &&
      (process.env.NODE_ENV === "production" ||
        !/^\d{6}$/.test(process.env.AUTH_FIXED_OTP))
    ) {
      throw new Error(
        "AUTH_FIXED_OTP requires six digits and is forbidden in production",
      );
    }
  }

  sign(payload: SecurityPayload) {
    return this.jwt.sign(payload, {
      issuer: AUTH_ISSUER,
      audience: AUTH_AUDIENCE,
      jwtid: randomUUID(),
      expiresIn:
        payload.purpose === "access"
          ? ACCESS_TOKEN_SECONDS
          : AUTH_POLICY.otpExpiresSeconds,
    });
  }

  verify(token: string, purposes: TokenPurpose[]) {
    try {
      const payload = this.jwt.verify<SecurityPayload>(token, {
        issuer: AUTH_ISSUER,
        audience: AUTH_AUDIENCE,
        algorithms: ["HS256"],
      });
      if (
        !payload.sub ||
        !purposes.includes(payload.purpose) ||
        !Number.isFinite(payload.passwordVersion)
      )
        securityError("invalidToken", 401);
      return payload;
    } catch {
      securityError("invalidToken", 401);
    }
  }
}
