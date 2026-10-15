import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PaymentMethodsRepository } from "./payment-methods.repository";
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  ReorderPaymentMethodsDto,
} from "./dto";

@Injectable()
export class PaymentMethodsService {
  constructor(private paymentMethodsRepository: PaymentMethodsRepository) {}

  create(dto: CreatePaymentMethodDto) {
    return this.paymentMethodsRepository.create(dto);
  }

  findAll(clinicId: string) {
    return this.paymentMethodsRepository.findAllByClinic(clinicId);
  }

  async findOne(id: string, clinicId: string) {
    const method = await this.paymentMethodsRepository.findById(id, clinicId);
    if (!method) {
      throw new NotFoundException("Payment method not found");
    }
    return method;
  }

  async update(id: string, dto: UpdatePaymentMethodDto, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.paymentMethodsRepository.update(id, dto, clinicId);
  }

  async deactivate(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.paymentMethodsRepository.deactivate(id, clinicId);
  }

  async remove(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.paymentMethodsRepository.hardDelete(id, clinicId);
  }

  async reorder(clinicId: string, dto: ReorderPaymentMethodsDto) {
    if (!clinicId) {
      throw new BadRequestException("clinicId is required");
    }

    const existing =
      await this.paymentMethodsRepository.findAllByClinic(clinicId);
    const existingIds = new Set(existing.map((m) => m.id));
    for (const id of dto.orderedIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(
          `Payment method ${id} not found in clinic`,
        );
      }
    }

    await this.paymentMethodsRepository.reorder(clinicId, dto.orderedIds);
    return this.paymentMethodsRepository.findAllByClinic(clinicId);
  }
}
