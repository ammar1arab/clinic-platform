import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { CreateServiceDto, UpdateServiceDto } from './dto';

@Injectable()
export class ServicesService {
  constructor(private servicesRepository: ServicesRepository) {}

  create(dto: CreateServiceDto) {
    return this.servicesRepository.create(dto);
  }

  findAll(clinicId: string) {
    return this.servicesRepository.findAllByClinic(clinicId);
  }

  async findOne(id: string) {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    return this.servicesRepository.update(id, dto);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.servicesRepository.deactivate(id);
  }

  async reactivate(id: string) {
    await this.findOne(id);
    return this.servicesRepository.reactivate(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.servicesRepository.hardDelete(id);
  }
}