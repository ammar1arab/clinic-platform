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
import { PaymentMethodsService } from "./payment-methods.service";
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  ReorderPaymentMethodsDto,
} from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("payment-methods")
export class PaymentMethodsController {
  constructor(private paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create({
      ...dto,
      clinicId: user.clinicId,
    });
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.paymentMethodsService.findAll(user.clinicId);
  }

  @Patch("reorder")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  reorder(
    @CurrentUser() user: AuthUser,
    @Body() dto: ReorderPaymentMethodsDto,
  ) {
    return this.paymentMethodsService.reorder(user.clinicId, dto);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.paymentMethodsService.findOne(id, user.clinicId);
  }

  @Patch(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  deactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.paymentMethodsService.deactivate(id, user.clinicId);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.update(id, dto, user.clinicId);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.paymentMethodsService.remove(id, user.clinicId);
  }
}
