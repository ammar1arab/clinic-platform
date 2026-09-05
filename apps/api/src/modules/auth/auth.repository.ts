import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { RegisterDto } from "./dto";

const include = {
  clinicUsers: {
    where: { isActive: true, clinic: { isActive: true } },
    include: { clinic: true },
  },
} as const;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}
  byEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include });
  }
  byId(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include });
  }
  create(dto: RegisterDto, passwordHash: string) {
    return this.prisma.user.create({
      data: {
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        mustChangePassword: true,
        clinicUsers: {
          create: { clinicId: dto.clinicId, name: dto.name, role: "owner" },
        },
      },
      include,
    });
  }
  verifyEmail(id: string) {
    return this.prisma.user.updateMany({
      where: { id, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });
  }
  async changePassword(
    id: string,
    previous: Date | null,
    passwordHash: string,
  ) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const changed = await tx.user.updateMany({
        where: { id, passwordChangedAt: previous },
        data: {
          passwordHash,
          mustChangePassword: false,
          emailVerifiedAt: new Date(),
          passwordChangedAt: new Date(
            Math.max(Date.now(), (previous?.getTime() ?? 0) + 1),
          ),
        },
      });
      if (changed.count)
        await tx.authOtpChallenge.updateMany({
          where: { userId: id, usedAt: null },
          data: { usedAt: new Date() },
        });
      return changed.count
        ? tx.user.findUniqueOrThrow({ where: { id }, include })
        : null;
    });
  }
}
