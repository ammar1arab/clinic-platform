import { Injectable, NotFoundException } from "@nestjs/common";
import { ClinicsRepository } from "./clinics.repository";
import { CreateClinicDto, UpdateClinicDto } from "./dto";

@Injectable()
export class ClinicsService {
  constructor(private clinicsRepository: ClinicsRepository) {}

  create(dto: CreateClinicDto) {
    return this.clinicsRepository.create(dto);
  }

  async findOne(id: string) {
    const clinic = await this.clinicsRepository.findById(id);
    if (!clinic) {
      throw new NotFoundException("Clinic not found");
    }
    return clinic;
  }

  async findStaff(clinicId: string) {
    await this.findOne(clinicId);
    return this.clinicsRepository.findStaff(clinicId);
  }

  async update(id: string, dto: UpdateClinicDto) {
    await this.findOne(id);
    return this.clinicsRepository.update(id, dto);
  }
}
