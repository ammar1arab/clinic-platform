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
import { ServicesService } from "./services.service";
import { CreateServiceDto, UpdateServiceDto } from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("services")
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceDto) {
    return this.servicesService.create({ ...dto, clinicId: user.clinicId });
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.servicesService.findAll(user.clinicId);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.servicesService.findOne(id, user.clinicId);
  }

  @Patch(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  deactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.servicesService.deactivate(id, user.clinicId);
  }

  @Patch(":id/reactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  reactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.servicesService.reactivate(id, user.clinicId);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, dto, user.clinicId);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.servicesService.remove(id, user.clinicId);
  }
}
