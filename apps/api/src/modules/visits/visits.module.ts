import { DocumentationRemindersWorker } from "./documentation-reminders.worker";
import { TemplatePublishWorker } from "./template-publish.worker";
import { Module } from "@nestjs/common";
import { AuthModule } from "@/modules/auth/auth.module";
import { DashboardModule } from "@/modules/dashboard/dashboard.module";
import { VisitsRepository } from "./visits.repository";
import { VisitsService } from "./visits.service";
import { TemplatesService } from "./templates.service";
import { VisitDocumentsService } from "./visit-documents.service";
import {
  ClinicalTemplatesController,
  VisitsController,
} from "./visits.controller";
@Module({
  imports: [AuthModule, DashboardModule],
  controllers: [VisitsController, ClinicalTemplatesController],
  providers: [
    DocumentationRemindersWorker,
    TemplatePublishWorker,
    VisitsRepository,
    VisitsService,
    TemplatesService,
    VisitDocumentsService,
  ],
  exports: [VisitsService],
})
export class VisitsModule {}
