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
import { Role } from "@prisma/client";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { Roles } from "@/modules/auth/decorators";
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
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
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
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  deactivate(@Param("id") id: string) {
    return this.practitionersService.deactivate(id);
  }

  @Patch(":id/reactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  reactivate(@Param("id") id: string) {
    return this.practitionersService.reactivate(id);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  remove(@Param("id") id: string) {
    return this.practitionersService.remove(id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  update(@Param("id") id: string, @Body() dto: UpdatePractitionerDto) {
    return this.practitionersService.update(id, dto);
  }

  @Put(":id/services")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  replaceServices(@Param("id") id: string, @Body() dto: AssignServicesDto) {
    return this.practitionersService.replaceServices(id, dto);
  }

  @Put(":id/availability")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  replaceAvailability(
    @Param("id") id: string,
    @Body() dto: ReplaceAvailabilityDto,
  ) {
    return this.practitionersService.replaceAvailability(id, dto);
  }

  @Put(":id/time-off")
  @UseGuards(RolesGuard)
  @Roles(Role.owner, Role.admin)
  replaceTimeOff(@Param("id") id: string, @Body() dto: ReplaceTimeOffDto) {
    return this.practitionersService.replaceTimeOff(id, dto);
  }
}
