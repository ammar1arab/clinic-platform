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
import { DiscountCodesService } from "./discount-codes.service";
import {
  CreateDiscountCodeDto,
  UpdateDiscountCodeDto,
  ValidateDiscountCodeDto,
} from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("discount-codes")
export class DiscountCodesController {
  constructor(private discountCodesService: DiscountCodesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDiscountCodeDto) {
    return this.discountCodesService.create({
      ...dto,
      clinicId: user.clinicId,
    });
  }

  @Post("validate")
  validate(
    @CurrentUser() user: AuthUser,
    @Body() dto: ValidateDiscountCodeDto,
  ) {
    return this.discountCodesService.validate({
      ...dto,
      clinicId: user.clinicId,
    });
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.discountCodesService.findAll(user.clinicId);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.discountCodesService.findOne(id, user.clinicId);
  }

  @Patch(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  deactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.discountCodesService.deactivate(id, user.clinicId);
  }

  @Patch(":id/reactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  reactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.discountCodesService.reactivate(id, user.clinicId);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateDiscountCodeDto,
  ) {
    return this.discountCodesService.update(id, dto, user.clinicId);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.discountCodesService.remove(id, user.clinicId);
  }
}
