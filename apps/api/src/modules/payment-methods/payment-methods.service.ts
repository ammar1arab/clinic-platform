import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentMethodsRepository } from './payment-methods.repository';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  ReorderPaymentMethodsDto,
} from './dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private paymentMethodsRepository: PaymentMethodsRepository) {}

  create(dto: CreatePaymentMethodDto) {
    return this.paymentMethodsRepository.create(dto);
  }

  findAll(clinicId: string) {
    return this.paymentMethodsRepository.findAllByClinic(clinicId);
  }

  async findOne(id: string) {
    const method = await this.paymentMethodsRepository.findById(id);
    if (!method) {
      throw new NotFoundException('Payment method not found');
    }
    return method;
  }

  async update(id: string, dto: UpdatePaymentMethodDto) {
    await this.findOne(id);
    return this.paymentMethodsRepository.update(id, dto);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.paymentMethodsRepository.deactivate(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.paymentMethodsRepository.hardDelete(id);
  }

  async reorder(clinicId: string, dto: ReorderPaymentMethodsDto) {
    if (!clinicId) {
      throw new BadRequestException('clinicId is required');
    }

    const existing = await this.paymentMethodsRepository.findAllByClinic(clinicId);
    const existingIds = new Set(existing.map((m) => m.id));
    for (const id of dto.orderedIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Payment method ${id} not found in clinic`);
      }
    }

    await this.paymentMethodsRepository.reorder(clinicId, dto.orderedIds);
    return this.paymentMethodsRepository.findAllByClinic(clinicId);
  }
}
