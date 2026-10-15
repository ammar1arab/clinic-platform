import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { ApiBearerAuth } from "@nestjs/swagger";
import { CurrentUser, Roles, type AuthUser } from "@/modules/auth/decorators";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto, UpdateRoomDto } from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("rooms")
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoomDto) {
    return this.roomsService.create({ ...dto, clinicId: user.clinicId });
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.roomsService.findAll(user.clinicId);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.roomsService.findOne(id, user.clinicId);
  }

  @Patch(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  deactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.roomsService.deactivate(id, user.clinicId);
  }

  @Patch(":id/reactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  reactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.roomsService.reactivate(id, user.clinicId);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, dto, user.clinicId);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.roomsService.remove(id, user.clinicId);
  }
}
