import { securityError } from "@/security/security-error";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ServicesRepository } from "./services.repository";
import { CreateServiceDto, UpdateServiceDto } from "./dto";

@Injectable()
export class ServicesService {
  constructor(private servicesRepository: ServicesRepository) {}

  async create(dto: CreateServiceDto) {
    if (
      dto.departmentId &&
      !(await this.servicesRepository.departmentInClinic(
        dto.departmentId,
        dto.clinicId,
      ))
    )
      securityError("clinicUnavailable", 403);
    return this.servicesRepository.create(dto);
  }

  findAll(clinicId: string) {
    return this.servicesRepository.findAllByClinic(clinicId);
  }

  async findOne(id: string, clinicId: string) {
    const service = await this.servicesRepository.findById(id, clinicId);
    if (!service) {
      throw new NotFoundException("Service not found");
    }
    return service;
  }

  async update(id: string, dto: UpdateServiceDto, clinicId: string) {
    await this.findOne(id, clinicId);
    if (
      dto.departmentId &&
      !(await this.servicesRepository.departmentInClinic(
        dto.departmentId,
        clinicId,
      ))
    )
      securityError("clinicUnavailable", 403);
    return this.servicesRepository.update(id, dto, clinicId);
  }

  async deactivate(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.servicesRepository.deactivate(id, clinicId);
  }

  async reactivate(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.servicesRepository.reactivate(id, clinicId);
  }

  async remove(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.servicesRepository.hardDelete(id, clinicId);
  }
}
