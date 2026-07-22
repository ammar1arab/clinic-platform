import { Injectable, NotFoundException } from '@nestjs/common';
import { RoomsRepository } from './rooms.repository';
import { CreateRoomDto, UpdateRoomDto } from './dto';

@Injectable()
export class RoomsService {
  constructor(private roomsRepository: RoomsRepository) {}

  create(dto: CreateRoomDto) {
    return this.roomsRepository.create(dto);
  }

  findAll(clinicId: string) {
    return this.roomsRepository.findAllByClinic(clinicId);
  }

  async findOne(id: string) {
    const room = await this.roomsRepository.findById(id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async update(id: string, dto: UpdateRoomDto) {
    await this.findOne(id);
    return this.roomsRepository.update(id, dto);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.roomsRepository.deactivate(id);
  }

  async reactivate(id: string) {
    await this.findOne(id);
    return this.roomsRepository.reactivate(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.roomsRepository.hardDelete(id);
  }
}