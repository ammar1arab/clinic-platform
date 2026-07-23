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
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { Roles } from "@/modules/auth/decorators";
import { PackagesService } from "./packages.service";
import { CreatePackageDto, UpdatePackageDto } from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("packages")
export class PackagesController {
  constructor(private packagesService: PackagesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  create(@Body() dto: CreatePackageDto) {
    return this.packagesService.create(dto);
  }

  @Get()
  findAll(@Query("clinicId") clinicId: string) {
    return this.packagesService.findAll(clinicId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.packagesService.findOne(id);
  }

  @Patch(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  deactivate(@Param("id") id: string) {
    return this.packagesService.deactivate(id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  update(@Param("id") id: string, @Body() dto: UpdatePackageDto) {
    return this.packagesService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  remove(@Param("id") id: string) {
    return this.packagesService.remove(id);
  }
}
