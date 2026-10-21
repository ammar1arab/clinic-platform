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

const GUEST_CLINIC_NAME = "Cureva Demo Clinic";

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

  clinicOwner(clinicId: string) {
    return this.prisma.user.findFirst({
      where: {
        clinicUsers: {
          some: {
            clinicId,
            role: "owner",
            isActive: true,
            clinic: { isActive: true },
          },
        },
      },
      select: {
        id: true,
        email: true,
        clinicUsers: {
          where: { clinicId, role: "owner", isActive: true },
          select: { name: true },
          take: 1,
        },
      },
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
  recordSignIn(id: string, at: Date) {
    return this.prisma.user.update({ where: { id }, data: { lastSignInAt: at } });
  }
  async openGuest(email: string, passwordHash: string) {
    const existing = await this.byEmail(email);
    if (existing) return this.isGuestAccount(existing) ? existing : null;

    try {
      return await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          emailVerifiedAt: new Date(),
          clinicUsers: {
            create: {
              role: "owner",
              name: "Demo Guest",
              clinic: {
                create: {
                  name: GUEST_CLINIC_NAME,
                  nameAr: "عيادة كيريفا التجريبية",
                  timezone: "Asia/Amman",
                },
              },
            },
          },
        },
        include,
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      ) {
        throw error;
      }

      const concurrent = await this.byEmail(email);
      return concurrent && this.isGuestAccount(concurrent) ? concurrent : null;
    }
  }

  private isGuestAccount(user: AuthAccount) {
    return (
      user.clinicUsers.length === 1 &&
      user.clinicUsers[0]?.role === "owner" &&
      user.clinicUsers[0].clinic.name === GUEST_CLINIC_NAME
    );
  }
  async changePassword(
    id: string,
    previous: Date | null,
    passwordHash: string,
    mustChangePassword = false,
  ) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const changed = await tx.user.updateMany({
        where: { id, passwordChangedAt: previous },
        data: {
          passwordHash,
          mustChangePassword,
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
