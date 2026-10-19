import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from "./dto";

@Injectable()
export class PaymentMethodsRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePaymentMethodDto) {
    return this.prisma.paymentMethod.create({ data: dto });
  }

  findAllByClinic(clinicId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { clinicId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  findById(id: string, clinicId: string) {
    return this.prisma.paymentMethod.findUnique({ where: { id, clinicId } });
  }

  update(id: string, dto: UpdatePaymentMethodDto, clinicId: string) {
    return this.prisma.paymentMethod.update({
      where: { id, clinicId },
      data: dto,
    });
  }

  deactivate(id: string, clinicId: string) {
    return this.prisma.paymentMethod.update({
      where: { id, clinicId },
      data: { isActive: false },
    });
  }

  reactivate(id: string, clinicId: string) {
    return this.prisma.paymentMethod.update({
      where: { id, clinicId },
      data: { isActive: true },
    });
  }

  hardDelete(id: string, clinicId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.appointment.updateMany({
        where: { paymentMethodId: id, clinicId },
        data: { paymentMethodId: null },
      });
      return tx.paymentMethod.delete({ where: { id, clinicId } });
    });
  }

  async reorder(clinicId: string, orderedIds: string[]) {
    return this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.paymentMethod.updateMany({
          where: { id, clinicId },
          data: { sortOrder: index },
        }),
      ),
    );
  }
}
