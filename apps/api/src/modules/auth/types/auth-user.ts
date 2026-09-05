import { Role } from "@prisma/client";

export type AuthUser = {
  userId: string;
  clinicUserId: string;
  clinicId: string;
  role: Role;
};

export type { SecurityPayload as JwtPayload } from "@/security/services/token.service";
