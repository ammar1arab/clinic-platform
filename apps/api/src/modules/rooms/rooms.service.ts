import { securityError } from "@/security/security-error";
import { Injectable, NotFoundException } from "@nestjs/common";
import { RoomsRepository } from "./rooms.repository";
import { CreateRoomDto, UpdateRoomDto } from "./dto";

@Injectable()
export class RoomsService {
  constructor(private roomsRepository: RoomsRepository) {}

  async create(dto: CreateRoomDto) {
    if (
      dto.departmentId &&
      !(await this.roomsRepository.departmentInClinic(
        dto.departmentId,
        dto.clinicId,
      ))
    )
      securityError("clinicUnavailable", 403);
    return this.roomsRepository.create(dto);
  }

  findAll(clinicId: string) {
    return this.roomsRepository.findAllByClinic(clinicId);
  }

  async findOne(id: string, clinicId: string) {
    const room = await this.roomsRepository.findById(id, clinicId);
    if (!room) {
      throw new NotFoundException("Room not found");
    }
    return room;
  }

  async update(id: string, dto: UpdateRoomDto, clinicId: string) {
    await this.findOne(id, clinicId);
    if (
      dto.departmentId &&
      !(await this.roomsRepository.departmentInClinic(
        dto.departmentId,
        clinicId,
      ))
    )
      securityError("clinicUnavailable", 403);
    return this.roomsRepository.update(id, dto, clinicId);
  }

  async deactivate(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.roomsRepository.deactivate(id, clinicId);
  }

  async reactivate(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.roomsRepository.reactivate(id, clinicId);
  }

  async remove(id: string, clinicId: string) {
    await this.findOne(id, clinicId);
    return this.roomsRepository.hardDelete(id, clinicId);
  }
}
