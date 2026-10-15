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
import { ApiBearerAuth } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { CurrentUser, Roles, type AuthUser } from "@/modules/auth/decorators";
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
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePackageDto) {
    return this.packagesService.create({ ...dto, clinicId: user.clinicId });
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.packagesService.findAll(user.clinicId);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.packagesService.findOne(id, user.clinicId);
  }

  @Patch(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  deactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.packagesService.deactivate(id, user.clinicId);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdatePackageDto,
  ) {
    return this.packagesService.update(id, dto, user.clinicId);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.packagesService.remove(id, user.clinicId);
  }
}
