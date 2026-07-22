import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto';

@Injectable()
export class PaymentMethodsRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePaymentMethodDto) {
    return this.prisma.paymentMethod.create({ data: dto });
  }

  findAllByClinic(clinicId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { clinicId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.paymentMethod.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdatePaymentMethodDto) {
    return this.prisma.paymentMethod.update({ where: { id }, data: dto });
  }

  deactivate(id: string) {
    return this.prisma.paymentMethod.update({
      where: { id },
      data: { isActive: false },
    });
  }

  hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.appointment.updateMany({
        where: { paymentMethodId: id },
        data: { paymentMethodId: null },
      });
      return tx.paymentMethod.delete({ where: { id } });
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
