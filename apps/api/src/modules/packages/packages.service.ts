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

  async findOne(id: string) {
    const pkg = await this.packagesRepository.findById(id);
    if (!pkg) throw new NotFoundException("Package not found");
    return pkg;
  }

  async update(id: string, dto: UpdatePackageDto) {
    await this.findOne(id);
    return this.packagesRepository.update(id, dto);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.packagesRepository.deactivate(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.packagesRepository.hardDelete(id);
  }
}
