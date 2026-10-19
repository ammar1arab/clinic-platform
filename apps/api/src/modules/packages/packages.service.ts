import { Injectable, NotFoundException } from "@nestjs/common";
import { PackagesRepository } from "./packages.repository";
import { CreatePackageDto, UpdatePackageDto } from "./dto";

@Injectable()
export class PackagesService {
  constructor(private packagesRepository: PackagesRepository) {}

  create(dto: CreatePackageDto) {
    return this.packagesRepository.create(dto);
  }

  findAll(clinicId: string) {
    return this.packagesRepository.findAllByClinic(clinicId);
  }

  async findOne(id: string, clinicId: string) {
    const pkg = await this.packagesRepository.findById(id, clinicId);
    if (!pkg) throw new NotFoundException("Package not found");
    return pkg;
  }

  async update(id: string, dto: UpdatePackageDto, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.packagesRepository.update(id, dto, clinicId);
  }

  async deactivate(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.packagesRepository.deactivate(id, clinicId);
  }

  async reactivate(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.packagesRepository.reactivate(id, clinicId);
  }

  async remove(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.packagesRepository.hardDelete(id, clinicId);
  }
}
