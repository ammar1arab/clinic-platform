import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateDiscountCodeDto, UpdateDiscountCodeDto } from "./dto";

@Injectable()
export class DiscountCodesRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateDiscountCodeDto) {
    return this.prisma.discountCode.create({
      data: {
        clinicId: dto.clinicId,
        code: dto.code.trim().toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxUses: dto.maxUses,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        isActive: dto.isActive ?? true,
      },
    });
  }

  findAllByClinic(clinicId: string) {
    return this.prisma.discountCode.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string) {
    return this.prisma.discountCode.findUnique({ where: { id } });
  }

  findByCode(clinicId: string, code: string) {
    return this.prisma.discountCode.findUnique({
      where: {
        clinicId_code: { clinicId, code: code.trim().toUpperCase() },
      },
    });
  }

  update(id: string, dto: UpdateDiscountCodeDto) {
    const data: Prisma.DiscountCodeUpdateInput = {};

    if (dto.code !== undefined) {
      data.code = dto.code.trim().toUpperCase();
    }
    if (dto.discountType !== undefined) {
      data.discountType = dto.discountType;
    }
    if (dto.discountValue !== undefined) {
      data.discountValue = dto.discountValue;
    }
    if (dto.maxUses !== undefined) {
      data.maxUses = dto.maxUses;
    }
    if (dto.validFrom !== undefined) {
      data.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    }
    if (dto.validTo !== undefined) {
      data.validTo = dto.validTo ? new Date(dto.validTo) : null;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return this.prisma.discountCode.update({
      where: { id },
      data,
    });
  }

  deactivate(id: string) {
    return this.prisma.discountCode.update({
      where: { id },
      data: { isActive: false },
    });
  }

  hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.patient.updateMany({
        where: { discountCodeId: id },
        data: { discountCodeId: null },
      });
      await tx.appointment.updateMany({
        where: { discountCodeId: id },
        data: { discountCodeId: null },
      });
      return tx.discountCode.delete({ where: { id } });
    });
  }

  incrementUsedCount(id: string) {
    return this.prisma.discountCode.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
    });
  }
}
