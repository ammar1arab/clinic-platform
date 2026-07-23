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
  create(@Body() dto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create(dto);
  }

  @Get()
  findAll(@Query("clinicId") clinicId: string) {
    return this.paymentMethodsService.findAll(clinicId);
  }

  @Patch("reorder")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  reorder(
    @Query("clinicId") clinicId: string,
    @Body() dto: ReorderPaymentMethodsDto,
  ) {
    return this.paymentMethodsService.reorder(clinicId, dto);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.paymentMethodsService.findOne(id);
  }

  @Patch(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  deactivate(@Param("id") id: string) {
    return this.paymentMethodsService.deactivate(id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  update(@Param("id") id: string, @Body() dto: UpdatePaymentMethodDto) {
    return this.paymentMethodsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  remove(@Param("id") id: string) {
    return this.paymentMethodsService.remove(id);
  }
}
