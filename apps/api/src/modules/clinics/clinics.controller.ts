import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/guards";
import { ClinicsService } from "./clinics.service";
import { CreateClinicDto, UpdateClinicDto } from "./dto";

@Controller("clinics")
export class ClinicsController {
  constructor(private clinicsService: ClinicsService) {}

  @Post()
  create(@Body() dto: CreateClinicDto) {
    return this.clinicsService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(":id/staff")
  findStaff(@Param("id") id: string) {
    return this.clinicsService.findStaff(id);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.clinicsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateClinicDto) {
    return this.clinicsService.update(id, dto);
  }
}
