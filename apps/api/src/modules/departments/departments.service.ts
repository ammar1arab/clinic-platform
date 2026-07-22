import { Injectable, NotFoundException } from '@nestjs/common';
import { DepartmentsRepository } from './departments.repository';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';

@Injectable()
export class DepartmentsService {
  constructor(private departmentsRepository: DepartmentsRepository) {}

  create(dto: CreateDepartmentDto) {
    return this.departmentsRepository.create(dto);
  }

  findAll(clinicId: string) {
    return this.departmentsRepository.findAllByClinic(clinicId);
  }

  async findOne(id: string) {
    const department = await this.departmentsRepository.findById(id);
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    return this.departmentsRepository.update(id, dto);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.departmentsRepository.deactivate(id);
  }

  async reactivate(id: string) {
    await this.findOne(id);
    return this.departmentsRepository.reactivate(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.departmentsRepository.hardDelete(id);
  }
}