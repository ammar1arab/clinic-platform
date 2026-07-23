import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/guards";
import { CurrentUser, type AuthUser } from "@/modules/auth/decorators";
import { ReferralsService } from "./referrals.service";
import {
  CreateReferralDto,
  ReferralOpinionDto,
  ReferralFiltersDto,
} from "./dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("referrals")
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReferralDto) {
    return this.referralsService.create(user.clinicUserId, dto);
  }

  @Get()
  findAll(@Query() filters: ReferralFiltersDto) {
    return this.referralsService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.referralsService.findOne(id);
  }

  @Patch(":id/accept")
  accept(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.referralsService.accept(id, user.clinicUserId);
  }

  @Patch(":id/reject")
  reject(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.referralsService.reject(id, user.clinicUserId);
  }

  @Patch(":id/opinion")
  setOpinion(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ReferralOpinionDto,
  ) {
    return this.referralsService.setOpinion(id, user.clinicUserId, dto);
  }
}
