import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { DiscountCodesRepository } from "./discount-codes.repository";
import {
  CreateDiscountCodeDto,
  UpdateDiscountCodeDto,
  ValidateDiscountCodeDto,
} from "./dto";

@Injectable()
export class DiscountCodesService {
  constructor(private discountCodesRepository: DiscountCodesRepository) {}

  async create(dto: CreateDiscountCodeDto) {
    const existing = await this.discountCodesRepository.findByCode(
      dto.clinicId,
      dto.code,
    );
    if (existing) {
      throw new ConflictException("Discount code already exists");
    }
    return this.discountCodesRepository.create(dto);
  }

  findAll(clinicId: string) {
    return this.discountCodesRepository.findAllByClinic(clinicId);
  }

  async findOne(id: string) {
    const code = await this.discountCodesRepository.findById(id);
    if (!code) throw new NotFoundException("Discount code not found");
    return code;
  }

  async update(id: string, dto: UpdateDiscountCodeDto) {
    const existing = await this.findOne(id);
    if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
      const clash = await this.discountCodesRepository.findByCode(
        existing.clinicId,
        dto.code,
      );
      if (clash) throw new ConflictException("Discount code already exists");
    }
    return this.discountCodesRepository.update(id, dto);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.discountCodesRepository.deactivate(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.discountCodesRepository.hardDelete(id);
  }

  /** Validate a code for checkout / appointment discount application. */
  async validate(dto: ValidateDiscountCodeDto) {
    const row = await this.discountCodesRepository.findByCode(
      dto.clinicId,
      dto.code,
    );
    if (!row || !row.isActive) {
      throw new BadRequestException("Invalid or inactive discount code");
    }

    const now = new Date();
    if (row.validFrom && row.validFrom > now) {
      throw new BadRequestException("Discount code is not yet valid");
    }
    if (row.validTo && row.validTo < now) {
      throw new BadRequestException("Discount code has expired");
    }
    if (row.maxUses != null && row.usedCount >= row.maxUses) {
      throw new BadRequestException(
        "Discount code has reached its usage limit",
      );
    }

    return {
      id: row.id,
      code: row.code,
      discountType: row.discountType,
      discountValue: Number(row.discountValue),
    };
  }

  async consume(id: string) {
    return this.discountCodesRepository.incrementUsedCount(id);
  }
}
