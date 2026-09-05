import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AUTH_AUDIENCE, AUTH_ISSUER } from "@/security/security.constants";
import type { SecurityPayload } from "@/security/services/token.service";
import { securityError } from "@/security/security-error";
import { AuthRepository } from "../auth.repository";
import type { AuthUser } from "../types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly repo: AuthRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
      issuer: AUTH_ISSUER,
      audience: AUTH_AUDIENCE,
      algorithms: ["HS256"],
    });
  }

  async validate(payload: SecurityPayload): Promise<AuthUser> {
    if (
      payload.purpose !== "access" ||
      !payload.sub ||
      !payload.clinicUserId ||
      !payload.clinicId
    )
      securityError("invalidToken", 401);
    const user = await this.repo.byId(payload.sub);
    const passwordVersion = user?.passwordChangedAt
      ? Number(user.passwordChangedAt)
      : 0;
    if (
      !user?.emailVerifiedAt ||
      user.mustChangePassword ||
      passwordVersion !== payload.passwordVersion
    )
      securityError("invalidToken", 401);
    const member = user.clinicUsers.find(
      (row) =>
        row.id === payload.clinicUserId && row.clinicId === payload.clinicId,
    );
    if (!member || user.clinicUsers.length !== 1)
      securityError("invalidToken", 401);
    return {
      userId: user.id,
      clinicUserId: member.id,
      clinicId: member.clinicId,
      role: member.role,
    };
  }
}
