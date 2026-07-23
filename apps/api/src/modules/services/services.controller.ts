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
import { JwtAuthGuard } from "@/modules/auth/guards";
import { ServicesService } from "./services.service";
import { CreateServiceDto, UpdateServiceDto } from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("services")
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  findAll(@Query("clinicId") clinicId: string) {
    return this.servicesService.findAll(clinicId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.servicesService.findOne(id);
  }

  // Specific :id/... routes must be registered before the generic :id patch
  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.servicesService.deactivate(id);
  }

  @Patch(":id/reactivate")
  reactivate(@Param("id") id: string) {
    return this.servicesService.reactivate(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.servicesService.remove(id);
  }
}
