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
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '@/modules/auth/guards';
import { Roles } from '@/modules/auth/decorators';
import { DiscountCodesService } from './discount-codes.service';
import {
  CreateDiscountCodeDto,
  UpdateDiscountCodeDto,
  ValidateDiscountCodeDto,
} from './dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('discount-codes')
export class DiscountCodesController {
  constructor(private discountCodesService: DiscountCodesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  create(@Body() dto: CreateDiscountCodeDto) {
    return this.discountCodesService.create(dto);
  }

  @Post('validate')
  validate(@Body() dto: ValidateDiscountCodeDto) {
    return this.discountCodesService.validate(dto);
  }

  @Get()
  findAll(@Query('clinicId') clinicId: string) {
    return this.discountCodesService.findAll(clinicId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.discountCodesService.findOne(id);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  deactivate(@Param('id') id: string) {
    return this.discountCodesService.deactivate(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  update(@Param('id') id: string, @Body() dto: UpdateDiscountCodeDto) {
    return this.discountCodesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin, Role.financial)
  remove(@Param('id') id: string) {
    return this.discountCodesService.remove(id);
  }
}
