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
      throw new ConflictException("Promocode already exists");
    }
    return this.discountCodesRepository.create(dto);
  }

  findAll(clinicId: string) {
    return this.discountCodesRepository.findAllByClinic(clinicId);
  }

  async findOne(id: string) {
    const code = await this.discountCodesRepository.findById(id);
    if (!code) throw new NotFoundException("Promocode not found");
    return code;
  }

  async update(id: string, dto: UpdateDiscountCodeDto) {
    const existing = await this.findOne(id);
    if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
      const clash = await this.discountCodesRepository.findByCode(
        existing.clinicId,
        dto.code,
      );
      if (clash) throw new ConflictException("Promocode already exists");
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

  async validate(dto: ValidateDiscountCodeDto) {
    const row = await this.discountCodesRepository.findByCode(
      dto.clinicId,
      dto.code,
    );
    if (!row || !row.isActive) {
      throw new BadRequestException("Invalid or inactive promocode");
    }

    const now = new Date();
    if (row.validFrom && row.validFrom > now) {
      throw new BadRequestException("Promocode is not yet valid");
    }
    if (row.validTo && row.validTo < now) {
      throw new BadRequestException("Promocode has expired");
    }
    if (row.maxUses != null && row.usedCount >= row.maxUses) {
      throw new BadRequestException("Promocode has reached its usage limit");
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
