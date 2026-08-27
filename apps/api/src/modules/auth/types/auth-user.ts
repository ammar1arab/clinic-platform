import { Role } from "@prisma/client";

export type AuthUser = {
  userId: string;
  clinicUserId: string;
  clinicId: string;
  role: Role;
};

export type JwtPayload = {
  sub: string;
  clinicUserId: string;
  clinicId: string;
  role: Role;
};
