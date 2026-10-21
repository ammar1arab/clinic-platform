import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
  UseFilters,
} from "@nestjs/common";
import type { Response } from "express";
import { CurrentUser, type AuthUser } from "@/modules/auth/decorators";
import { JwtAuthGuard, RolesGuard } from "@/modules/auth/guards";
import { Roles } from "@/modules/auth/decorators";
import { Role } from "@prisma/client";
import { VisitExceptionFilter } from "./visit-errors";
import { VisitsService } from "./visits.service";
import { TemplatesService } from "./templates.service";
import {
  AvailableTemplatesDto,
  VisitHistoryQueryDto,
  DocumentQueryDto,
  ReleaseDocumentDto,
  VoidInvoiceDto,
  AddendumDto,
  FeedbackDto,
  InvoiceDraftDto,
  InvoiceCorrectionDto,
  NoteDraftDto,
  NotePreferenceDto,
  PaymentDto,
  PresenceDto,
  ReasonDto,
  ReportAmendDto,
  ReportDraftDto,
  ReversalDto,
  RevisionDto,
  ScheduleTemplateDto,
  SignDto,
  StartVisitDto,
  TemplateDto,
  UpdateTemplateDto,
  VisitFiltersDto,
} from "./visits.dto";

@UseFilters(VisitExceptionFilter)
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.owner, Role.admin, Role.practitioner, Role.financial)
export class VisitsController {
  constructor(
    private readonly visits: VisitsService,
    private readonly templates: TemplatesService,
  ) {}
  @Get("visits") @Header("Cache-Control", "no-store") list(
    @CurrentUser() actor: AuthUser,
    @Query() query: VisitFiltersDto,
  ) {
    return this.visits.list(actor, query);
  }
  @Get("appointments/:id/workspace")
  @Header("Cache-Control", "no-store")
  workspace(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.visits.workspace(actor, id);
  }
  @Post("appointments/:id/check-in")
  @Header("Cache-Control", "no-store")
  presence(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: PresenceDto,
  ) {
    return this.visits.presence(actor, id, body.source);
  }
  @Post("appointments/:id/mark-waiting")
  @Header("Cache-Control", "no-store")
  waiting(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.visits.presence(
      actor,
      id,
      actor.role === "practitioner" ? "practitioner" : "front_desk",
      true,
    );
  }
  @Post("appointments/:id/visits/start")
  @Header("Cache-Control", "no-store")
  start(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: StartVisitDto,
  ) {
    return this.visits.start(actor, id, body.expectedAppointmentRevision);
  }
  @Post("visits/:id/finish") @Header("Cache-Control", "no-store") finish(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: RevisionDto,
  ) {
    return this.visits.finish(actor, id, body.expectedRevision);
  }
  @Put("visits/:id/note/draft") @Header("Cache-Control", "no-store") saveNote(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: NoteDraftDto,
  ) {
    return this.visits.saveNote(actor, id, body);
  }
  @Post("visits/:id/note/sign") @Header("Cache-Control", "no-store") signNote(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: SignDto,
  ) {
    return this.visits.signNote(actor, id, body.revision);
  }
  @Post("visits/:id/note/addenda")
  @Header("Cache-Control", "no-store")
  addendum(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AddendumDto,
  ) {
    return this.visits.addendum(actor, id, body);
  }
  @Get("visits/:id/note/history") @Header("Cache-Control", "no-store") history(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Query() query: VisitHistoryQueryDto,
  ) {
    return this.visits.history(actor, id, query);
  }
  @Post("visits/:id/note/unlock") @Header("Cache-Control", "no-store") unlock(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReasonDto,
  ) {
    return this.visits.unlock(actor, id, body.reason);
  }
  @Post("visits/:id/note/revoke-unlock")
  @Header("Cache-Control", "no-store")
  revoke(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReasonDto,
  ) {
    return this.visits.unlock(actor, id, body.reason, true);
  }
  @Get("visits/:id/medical-report") @Header("Cache-Control", "no-store") report(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.visits.report(actor, id);
  }
  @Put("visits/:id/medical-report/draft")
  @Header("Cache-Control", "no-store")
  saveReport(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReportDraftDto,
  ) {
    return this.visits.saveReport(actor, id, body);
  }
  @Post("visits/:id/medical-report/sign")
  @Header("Cache-Control", "no-store")
  signReport(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: SignDto,
  ) {
    return this.visits.signReport(actor, id, body.revision);
  }
  @Post("visits/:id/medical-report/amend")
  @Header("Cache-Control", "no-store")
  amendReport(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReportAmendDto,
  ) {
    return this.visits.signReport(actor, id, body.revision, body);
  }
  @Get("visits/:id/medical-report/pdf")
  @Header("Cache-Control", "no-store")
  async reportPdf(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Query() query: DocumentQueryDto,
    @Res() res: Response,
  ) {
    const doc = await this.visits.pdf(
      actor,
      id,
      "medical_report",
      query.revision,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${doc.filename}"`,
    );
    res.send(doc.buffer);
  }
  @Get("visits/:id/invoice") @Header("Cache-Control", "no-store") invoice(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.visits.invoice(actor, id);
  }
  @Put("visits/:id/invoice/draft")
  @Header("Cache-Control", "no-store")
  saveInvoice(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: InvoiceDraftDto,
  ) {
    return this.visits.saveInvoice(actor, id, body);
  }
  @Post("visits/:id/invoice/feedback")
  @Header("Cache-Control", "no-store")
  feedback(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: FeedbackDto,
  ) {
    return this.visits.feedback(actor, id, body.message);
  }
  @Post("visits/:id/invoice/feedback/:feedbackId/resolve")
  @Header("Cache-Control", "no-store")
  resolveFeedback(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("feedbackId", ParseUUIDPipe) feedbackId: string,
    @Body() body: ReasonDto,
  ) {
    return this.visits.resolveFeedback(actor, id, feedbackId, body.reason);
  }
  @Post("visits/:id/invoice/issue") @Header("Cache-Control", "no-store") issue(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: SignDto,
  ) {
    return this.visits.issueInvoice(actor, id, body.revision);
  }
  @Post("invoices/:id/payments") @Header("Cache-Control", "no-store") payment(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: PaymentDto,
  ) {
    return this.visits.payment(actor, id, body);
  }
  @Post("invoices/:id/reversals") @Header("Cache-Control", "no-store") reversal(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReversalDto,
  ) {
    return this.visits.payment(actor, id, body, true);
  }
  @Post("visits/:id/invoice/correct")
  @Header("Cache-Control", "no-store")
  correctInvoice(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: InvoiceCorrectionDto,
  ) {
    return this.visits.correctInvoice(actor, id, input);
  }
  @Post("visits/:id/invoice/void")
  @Header("Cache-Control", "no-store")
  voidInvoice(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: VoidInvoiceDto,
  ) {
    return this.visits.voidInvoice(actor, id, body.revision, body.reason);
  }
  @Post("visit-documents/:id/release")
  @Header("Cache-Control", "no-store")
  release(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReleaseDocumentDto,
  ) {
    return this.visits.releaseDocument(actor, id, body.released, body.reason);
  }
  @Get("visits/:id/invoice/pdf")
  @Header("Cache-Control", "no-store")
  async invoicePdf(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Query() query: DocumentQueryDto,
    @Res() res: Response,
  ) {
    const doc = await this.visits.pdf(actor, id, "invoice", query.revision);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${doc.filename}"`,
    );
    res.send(doc.buffer);
  }
  @Get("practitioners/me/note-preference")
  @Header("Cache-Control", "no-store")
  preference(@CurrentUser() actor: AuthUser) {
    return this.templates.preference(actor);
  }
  @Put("practitioners/me/note-preference")
  @Header("Cache-Control", "no-store")
  setPreference(
    @CurrentUser() actor: AuthUser,
    @Body() body: NotePreferenceDto,
  ) {
    return this.templates.preference(actor, body.templateId);
  }
}
@UseFilters(VisitExceptionFilter)
@Controller("clinical-note-templates")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.owner, Role.practitioner)
export class ClinicalTemplatesController {
  constructor(private readonly templates: TemplatesService) {}
  @Get("default")
  clinicDefault(@CurrentUser() actor: AuthUser) {
    return this.templates.clinicDefault(actor);
  }
  @Put("default")
  setClinicDefault(@CurrentUser() actor: AuthUser, @Body() body: NotePreferenceDto) {
    return this.templates.clinicDefault(actor, body.templateId);
  }
  @Get("starters")
  starters(@CurrentUser() actor: AuthUser) { return this.templates.starters(actor); }
  @Get("starter") @Header("Cache-Control", "no-store") starter(
    @CurrentUser() actor: AuthUser,
  ) {
    return this.templates.starter(actor);
  }
  @Get("available") @Header("Cache-Control", "no-store") available(
    @CurrentUser() actor: AuthUser,
    @Query() query: AvailableTemplatesDto,
  ) {
    return this.templates.available(actor, query.appointmentId);
  }
  @Get() @Header("Cache-Control", "no-store") list(
    @CurrentUser() actor: AuthUser,
  ) {
    return this.templates.list(actor);
  }
  @Post() @Header("Cache-Control", "no-store") create(
    @CurrentUser() actor: AuthUser,
    @Body() body: TemplateDto,
  ) {
    return this.templates.create(actor, body);
  }
  @Get(":id") @Header("Cache-Control", "no-store") get(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.templates.get(actor, id);
  }
  @Patch(":id") @Header("Cache-Control", "no-store") update(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateTemplateDto,
  ) {
    return this.templates.update(actor, id, body);
  }
  @Post(":id/publish") @Header("Cache-Control", "no-store") publish(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: SignDto,
  ) {
    return this.templates.publish(actor, id, body.revision);
  }
  @Post(":id/schedule") @Header("Cache-Control", "no-store") schedule(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ScheduleTemplateDto,
  ) {
    return this.templates.schedule(
      actor,
      id,
      body.revision,
      new Date(body.scheduledAt),
    );
  }
  @Post(":id/archive") @Header("Cache-Control", "no-store") archive(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: SignDto,
  ) {
    return this.templates.archive(actor, id, body.revision);
  }
  @Post(":id/draft") @Header("Cache-Control", "no-store") draft(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: SignDto,
  ) {
    return this.templates.draft(actor, id, body.revision);
  }
  @Post(":id/restore") @Header("Cache-Control", "no-store") restore(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: SignDto,
  ) {
    return this.templates.draft(actor, id, body.revision, true);
  }
  @Delete(":id") @Header("Cache-Control", "no-store") remove(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.templates.remove(actor, id);
  }
  @Post(":id/clone") @Header("Cache-Control", "no-store") clone(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.templates.clone(actor, id);
  }
}
