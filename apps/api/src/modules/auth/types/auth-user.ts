import { Role } from "@prisma/client";

/** Authenticated user attached to the request by JwtStrategy. */
export type AuthUser = {
  userId: string;
  clinicUserId: string;
  clinicId: string;
  role: Role;
};

/** JWT access-token payload signed by AuthService. */
export type JwtPayload = {
  sub: string;
  clinicUserId: string;
  clinicId: string;
  role: Role;
};
