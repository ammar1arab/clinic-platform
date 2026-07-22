import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto } from './dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post()
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get()
  findAll(@Query('clinicId') clinicId: string) {
    return this.roomsService.findAll(clinicId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  // Specific :id/... routes must be registered before the generic :id patch
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.roomsService.deactivate(id);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.roomsService.reactivate(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}