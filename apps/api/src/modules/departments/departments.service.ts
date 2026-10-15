import { Injectable, NotFoundException } from "@nestjs/common";
import { DepartmentsRepository } from "./departments.repository";
import { CreateDepartmentDto, UpdateDepartmentDto } from "./dto";

@Injectable()
export class DepartmentsService {
  constructor(private departmentsRepository: DepartmentsRepository) {}

  create(dto: CreateDepartmentDto) {
    return this.departmentsRepository.create(dto);
  }

  findAll(clinicId: string) {
    return this.departmentsRepository.findAllByClinic(clinicId);
  }

  async findOne(id: string, clinicId: string) {
    const department = await this.departmentsRepository.findById(id, clinicId);
    if (!department) {
      throw new NotFoundException("Department not found");
    }
    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.departmentsRepository.update(id, dto, clinicId);
  }

  async deactivate(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.departmentsRepository.deactivate(id, clinicId);
  }

  async reactivate(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.departmentsRepository.reactivate(id, clinicId);
  }

  async remove(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.departmentsRepository.hardDelete(id, clinicId);
  }
}
