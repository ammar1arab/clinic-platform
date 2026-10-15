import type { AccountProfileInput } from "@clinic/types";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { RegisterDto } from "./dto";

const include = {
  clinicUsers: {
    where: { isActive: true, clinic: { isActive: true } },
    include: { clinic: true },
  },
} as const;

export type AuthAccount = Prisma.UserGetPayload<{ include: typeof include }>;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}
  updateProfile(id: string, clinicId: string, input: AccountProfileInput) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.clinicUser.findFirst({
        where: { id, clinicId, isActive: true },
        select: {
          user: { select: { id: true, email: true, passwordChangedAt: true } },
        },
      });
      if (!member) return { count: 0 };
      return tx.clinicUser.updateMany({
        where: { id, clinicId, isActive: true },
        data: {
          name: input.name,
          imageUrl: input.imageUrl || null,
          ...(input.nameAr !== undefined && {
            nameAr: input.nameAr.trim() || null,
          }),
          ...(input.phone !== undefined && {
            phone: input.phone.trim() || null,
          }),
        },
      });
    });
  }

  otpAccount(id: string, clinicId: string) {
    return this.prisma.user.findFirst({
      where: {
        clinicUsers: {
          some: { id, clinicId, isActive: true, clinic: { isActive: true } },
          every: { clinicId },
        },
      },
      select: { id: true, email: true, passwordChangedAt: true },
    });
  }

  resetPassword(id: string, clinicId: string, passwordHash: string) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.clinicUser.findFirst({
        where: { id, clinicId },
        select: { user: { select: { id: true, passwordChangedAt: true } } },
      });
      if (!member) return false;
      const previous = member.user.passwordChangedAt;
      const changed = await tx.user.updateMany({
        where: {
          id: member.user.id,
          passwordChangedAt: previous,
          clinicUsers: { some: { id, clinicId }, every: { clinicId } },
        },
        data: {
          passwordHash,
          mustChangePassword: true,
          passwordChangedAt: new Date(
            Math.max(Date.now(), (previous?.getTime() ?? 0) + 1),
          ),
        },
      });
      if (!changed.count) return false;
      await tx.authOtpChallenge.updateMany({
        where: { userId: member.user.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      return true;
    });
  }

  changeEmail(id: string, email: string, passwordVersion: number) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        select: { email: true, passwordChangedAt: true },
      });
      if (!user || (user.passwordChangedAt?.getTime() ?? 0) !== passwordVersion)
        return false;
      const taken = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (taken && taken.id !== id) return false;
      const changed = await tx.user.updateMany({
        where: {
          id,
          email: user.email,
          passwordChangedAt: user.passwordChangedAt,
        },
        data: {
          email,
          emailVerifiedAt: new Date(),
          passwordChangedAt: new Date(
            Math.max(Date.now(), (user.passwordChangedAt?.getTime() ?? 0) + 1),
          ),
        },
      });
      if (!changed.count) return false;
      await tx.authOtpChallenge.updateMany({
        where: { userId: id, usedAt: null },
        data: { usedAt: new Date() },
      });
      return true;
    });
  }

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
  async openGuest(email: string) {
    const user = await this.byEmail(email);
    if (!user || (user.emailVerifiedAt && !user.mustChangePassword))
      return user;
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mustChangePassword: false,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    });
    return this.byId(user.id);
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
