import { EmailExceptionFilter } from "./email-errors";
import {
  Body,
  UseFilters,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { CurrentUser, Roles, type AuthUser } from "@/modules/auth/decorators";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { EmailsService } from "./emails.service";
import { EMAIL_VARIABLES } from "./email-template";
import {
  EmailHistoryDto,
  EmailPaginationDto,
  EmailSelectionDto,
  EmailSettingsDto,
  PreviewEmailDto,
  SendEmailDto,
  TestEmailDto,
} from "./dto/email.dto";

@ApiTags("Emails")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.owner, Role.admin)
@UseFilters(EmailExceptionFilter)
@Controller("emails")
export class EmailsController {
  constructor(private readonly emails: EmailsService) {}

  @Post("recipients/preview")
  @HttpCode(200)
  recipients(@CurrentUser() user: AuthUser, @Body() dto: EmailSelectionDto) {
    return this.emails.recipients(user, dto);
  }

  @Post("preview")
  @HttpCode(200)
  preview(@CurrentUser() user: AuthUser, @Body() dto: PreviewEmailDto) {
    return this.emails.preview(user, dto);
  }

  @Post("test")
  @HttpCode(202)
  test(@CurrentUser() user: AuthUser, @Body() dto: TestEmailDto) {
    return this.emails.test(user, dto);
  }

  @Post("send")
  @HttpCode(202)
  send(@CurrentUser() user: AuthUser, @Body() dto: SendEmailDto) {
    return this.emails.send(user, dto);
  }

  @Get("variables")
  variables() {
    return {
      variables: EMAIL_VARIABLES,
    };
  }

  @Get("settings")
  async settings(@CurrentUser() user: AuthUser) {
    return this.emails.settings(user);
  }

  @Put("settings")
  @Roles(Role.owner)
  async replaceSettings(
    @CurrentUser() user: AuthUser,
    @Body() dto: EmailSettingsDto,
  ) {
    return this.emails.replaceSettings(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: EmailHistoryDto) {
    return this.emails.list(user, query);
  }

  @Get(":id")
  detail(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Query() query: EmailPaginationDto,
  ) {
    return this.emails.detail(user, id, query);
  }
}
