import { Module } from "@nestjs/common";
import { SecurityModule } from "@/security/security.module";
import { EmailsController } from "./emails.controller";
import { EmailWebhookController } from "./email-webhook.controller";
import { EmailsService } from "./emails.service";
import { EmailsRepository } from "./emails.repository";
import { EmailAudienceRepository } from "./email-audience.repository";
import { EmailDispatchWorker } from "./email-dispatch.worker";
import { EmailWebhooksService } from "./email-webhooks.service";

@Module({
  imports: [SecurityModule],
  controllers: [
    EmailsController,
    EmailWebhookController,
  ],
  providers: [
    EmailsService,
    EmailsRepository,
    EmailAudienceRepository,
    EmailDispatchWorker,
    EmailWebhooksService,
  ],
  exports: [EmailsService],
})
export class EmailsModule {}
