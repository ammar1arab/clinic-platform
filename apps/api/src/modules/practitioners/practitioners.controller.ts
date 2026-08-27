import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/guards";
import { PractitionersService } from "./practitioners.service";
import {
  AssignServicesDto,
  CreatePractitionerDto,
  ReplaceAvailabilityDto,
  ReplaceTimeOffDto,
  UpdatePractitionerDto,
} from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("practitioners")
export class PractitionersController {
  constructor(private practitionersService: PractitionersService) {}

  @Post()
  create(@Body() dto: CreatePractitionerDto) {
    return this.practitionersService.create(dto);
  }

  @Get()
  @ApiQuery({ name: "clinicId", required: true, type: String })
  findAll(@Query("clinicId") clinicId: string) {
    return this.practitionersService.findAll(clinicId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.practitionersService.findOne(id);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.practitionersService.deactivate(id);
  }

  @Patch(":id/reactivate")
  reactivate(@Param("id") id: string) {
    return this.practitionersService.reactivate(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.practitionersService.remove(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePractitionerDto) {
    return this.practitionersService.update(id, dto);
  }

  @Put(":id/services")
  replaceServices(@Param("id") id: string, @Body() dto: AssignServicesDto) {
    return this.practitionersService.replaceServices(id, dto);
  }

  @Put(":id/availability")
  replaceAvailability(
    @Param("id") id: string,
    @Body() dto: ReplaceAvailabilityDto,
  ) {
    return this.practitionersService.replaceAvailability(id, dto);
  }

  @Put(":id/time-off")
  replaceTimeOff(@Param("id") id: string, @Body() dto: ReplaceTimeOffDto) {
    return this.practitionersService.replaceTimeOff(id, dto);
  }
}
