import { storedClinicalSections, storedReportSections, storedInvoiceLines } from "./clinical-validation";
import { REPORT_TYPE, getSharedTranslations } from "@clinic/types";
import { getLocale } from "@/infrastructure/i18n.context";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { AuthUser } from "@/modules/auth/types";
import { DashboardGateway } from "@/modules/dashboard/dashboard.gateway";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import {
  NOTIFICATION_TYPE,
  type InvoiceLine,
  type ReportSections,
  type VisitListResponse,
} from "@clinic/types";
import {
  VisitsRepository,
  type VisitRow,
  type SummaryRow,
  type VisitTx,
  type WorkspaceRow,
  summaryInclude,
} from "./visits.repository";
import { TemplatesService, publishedSnapshot, toJson } from "./templates.service";
import {
  VisitDocumentsService,
  type VisitDocumentSnapshot,
} from "./visit-documents.service";
import {
  eventDto,
  invoiceDto,
  noteLocked,
  summary,
  workspaceDto,
} from "./visit-presenter";
import { validateValues, blankReport } from "./clinical-validation";
import {
  assertReportDetails,
  newReferenceNumber,
  normalizeReportDetails,
  reportDetailsData,
  restDays,
  storedReportDetails,
} from "./report-details";
import { visitError } from "./visit-errors";
import {
  AddendumDto,
  InvoiceDraftDto,
  InvoiceCorrectionDto,
  NoteDraftDto,
  PaymentDto,
  ReportAmendDto,
  ReportDraftDto,
  ReversalDto,
  VisitFiltersDto,
  VisitHistoryQueryDto,
} from "./visits.dto";
import { createHash } from "node:crypto";
@Injectable()
export class VisitsService {
  constructor(
    private readonly repo: VisitsRepository,
    private readonly templates: TemplatesService,
    private readonly documents: VisitDocumentsService,
    private readonly gateway: DashboardGateway,
    private readonly notifications: NotificationsService,
  ) {}
  private permit(actor: AuthUser, capability: "clinical" | "billing" | "read") {
    if (
      (capability === "clinical" && actor.role !== "practitioner") ||
      (capability === "billing" && actor.role !== "owner") ||
      (capability === "read" &&
        !["owner", "admin", "financial", "practitioner"].includes(actor.role))
    )
      visitError("visitForbidden", 403);
  }
  private changed(clinicId: string) {
    this.gateway.emitAppointmentChanged(clinicId);
    this.gateway.emitVisitChanged(clinicId);
  }
  private notifyArrival(actor: AuthUser, row: WorkspaceRow) {
    return this.notifications.notifyDoctor(NOTIFICATION_TYPE.QUEUE_PATIENT_WAITING, {
      clinicId: actor.clinicId,
      doctorId: row.doctorId,
      appointmentId: row.id,
      scheduledAt: row.scheduledAt,
      patient: row.patient,
      actorId: actor.clinicUserId,
    });
  }
  private revision(current: number, expected: number) {
    if (current !== expected) visitError("visitRevisionConflict", 409);
  }
  private active(row: WorkspaceRow) {
    if (["cancelled", "no_show"].includes(row.status))
      visitError("visitInvalidTransition", 409);
  }
  private editable(row: WorkspaceRow, visit: VisitRow) {
    this.active(row);
    if (visit.note?.signedAt) visitError("clinicalNoteAlreadySigned", 409);
    if (noteLocked(visit)) visitError("clinicalNoteLocked", 423);
  }
  private async event(
    tx: VisitTx,
    actor: AuthUser,
    visitId: string,
    kind: string,
    snapshot?: unknown,
    reason?: string,
  ) {
    return tx.visitEvent.create({
      data: {
        clinicId: actor.clinicId,
        actorId: actor.clinicUserId,
        visitId,
        kind,
        ...(snapshot !== undefined && { snapshot: toJson(snapshot) }),
        reason,
      },
    });
  }
  private async read(tx: VisitTx, actor: AuthUser, id: string) {
    return workspaceDto(await this.repo.appointment(tx, actor, id), actor);
  }
  async workspace(actor: AuthUser, appointmentId: string) {
    this.permit(actor, "read");
    return this.repo.transaction((tx) => this.read(tx, actor, appointmentId));
  }
  async list(
    actor: AuthUser,
    filters: VisitFiltersDto,
  ): Promise<VisitListResponse> {
    this.permit(actor, "read");
    if (
      filters.from &&
      filters.to &&
      new Date(filters.from) > new Date(filters.to)
    )
      visitError("visitInvalidDateRange");
    const now = new Date();
    const clauses: Prisma.AppointmentWhereInput[] = [];
    if (filters.queue === "not_started")
      clauses.push({
        visit: null,
        status: { in: ["unconfirmed", "confirmed", "checked_in", "waiting"] },
      });
    if (filters.queue === "in_progress")
      clauses.push({ visit: { is: { finishedAt: null } } });
    if (filters.queue === "documentation_pending")
      clauses.push({
        visit: {
          is: { finishedAt: { not: null }, noteStatus: { not: "signed" } },
        },
      });
    if (filters.queue === "locked")
      clauses.push({
        visit: {
          is: {
            documentationDeadlineAt: { lte: now },
            unlockGrantedAt: null,
            noteStatus: { not: "signed" },
          },
        },
      });
    if (filters.queue === "report_pending")
      clauses.push({
        visit: {
          is: { noteStatus: "signed", reportStatus: { not: "signed" } },
        },
      });
    if (filters.queue === "invoice_review")
      clauses.push({
        visit: {
          is: { finishedAt: { not: null }, invoiceStatus: "awaiting_review" },
        },
      });
    if (filters.queue === "completed")
      clauses.push({
        visit: {
          is: {
            finishedAt: { not: null },
            noteStatus: "signed",
            reportStatus: "signed",
            ...(actor.role !== "practitioner" && { invoiceStatus: "issued" }),
          },
        },
      });
    if (filters.noteStatus === "locked")
      clauses.push({
        visit: {
          is: {
            documentationDeadlineAt: { lte: now },
            unlockGrantedAt: null,
            noteStatus: { not: "signed" },
          },
        },
      });
    else if (filters.noteStatus === "reopened")
      clauses.push({
        visit: {
          is: { unlockGrantedAt: { not: null }, noteStatus: { not: "signed" } },
        },
      });
    else if (filters.noteStatus === "not_started")
      clauses.push({
        OR: [
          { visit: null },
          {
            visit: {
              is: {
                note: null,
                documentationDeadlineAt: { gt: now },
                unlockGrantedAt: null,
              },
            },
          },
        ],
      });
    else if (filters.noteStatus)
      clauses.push({
        visit: {
          is: {
            noteStatus: filters.noteStatus,
            ...(filters.noteStatus !== "signed" && {
              documentationDeadlineAt: { gt: now },
              unlockGrantedAt: null,
            }),
          },
        },
      });
    if (filters.reportStatus)
      clauses.push(
        filters.reportStatus === "pending_note"
          ? {
              OR: [
                { visit: null },
                { visit: { is: { reportStatus: "pending_note" } } },
              ],
            }
          : { visit: { is: { reportStatus: filters.reportStatus } } },
      );
    if (filters.invoiceStatus)
      clauses.push(
        filters.invoiceStatus === "preparing"
          ? {
              OR: [
                { visit: null },
                { visit: { is: { invoiceStatus: "preparing" } } },
              ],
            }
          : { visit: { is: { invoiceStatus: filters.invoiceStatus } } },
      );
    const where: Prisma.AppointmentWhereInput = {
      clinicId: actor.clinicId,
      doctor: { clinicId: actor.clinicId },
      patient: { clinicId: actor.clinicId },
      ...(actor.role === "practitioner"
        ? { doctorId: actor.clinicUserId }
        : filters.practitionerId
          ? { doctorId: filters.practitionerId }
          : {}),
      ...(filters.appointmentStatus && {
        status: filters.appointmentStatus,
      }),
      ...(filters.from || filters.to
        ? {
            scheduledAt: {
              ...(filters.from && { gte: new Date(filters.from) }),
              ...(filters.to && { lte: new Date(filters.to) }),
            },
          }
        : {}),
      ...(clauses.length && { AND: clauses }),
      ...(filters.search && {
        patient: {
          clinicId: actor.clinicId,
          OR: ["firstNameEn", "lastNameEn", "firstNameAr", "lastNameAr"].map(
            (key) => ({
              [key]: { contains: filters.search, mode: "insensitive" },
            }),
          ),
        },
      }),
    };
    return this.repo.transaction(async (tx) => {
      const priorities: SummaryRow["status"][][] = [
        ["in_progress"],
        ["checked_in", "waiting"],
        ["confirmed", "unconfirmed"],
      ];
      const counts = await tx.appointment.groupBy({ by: ["status"], where, _count: { _all: true } });
      const total = counts.reduce((sum, group) => sum + group._count._all, 0);
      const ids: string[] = [];
      let offset = (filters.page - 1) * filters.limit;
      for (let index = 0; index <= priorities.length && ids.length < filters.limit; index++) {
        const statuses = priorities[index];
        const matches = (status: SummaryRow["status"]) => statuses ? statuses.includes(status) : !priorities.some((group) => group.includes(status));
        const count = counts.reduce((sum, group) => sum + (matches(group.status) ? group._count._all : 0), 0);
        if (offset >= count) { offset -= count; continue; }
        const direction = statuses ? "asc" : "desc";
        const page = await tx.appointment.findMany({
          where: { AND: [where, { status: statuses ? { in: statuses } : { notIn: priorities.flat() } }] },
          select: { id: true },
          orderBy: [{ scheduledAt: direction }, { id: direction }],
          skip: offset,
          take: Math.min(count - offset, filters.limit - ids.length),
        });
        ids.push(...page.map((item) => item.id));
        offset = 0;
      }
      const rows = ids.length ? await tx.appointment.findMany({ where: { clinicId: actor.clinicId, id: { in: ids } }, include: summaryInclude }) : [];
      const byId = new Map(rows.map((row) => [row.id, row]));
      return {
        items: ids.flatMap((id) => { const row = byId.get(id); return row ? [summary(row, now)] : []; }),
        total,
        page: filters.page,
        limit: filters.limit,
        serverNow: now.toISOString(),
      };
    });
  }
  async presence(actor: AuthUser, id: string, source: string, waiting = false, statusReason?: string) {
    if (!["owner", "admin", "practitioner"].includes(actor.role))
      visitError("visitForbidden", 403);
    let arrival: WorkspaceRow | null = null;
    const result = await this.repo.withAppointment(
      actor,
      id,
      async (tx, row) => {
        this.active(row);
        if (
          row.visit ||
          !["confirmed", "checked_in", "waiting"].includes(row.status)
        )
          visitError("visitInvalidTransition", 409);
        if (waiting && row.sessionType === "online") {
          if (!row.presenceConfirmedAt)
            visitError("visitPresenceRequired", 409);
          source = row.presenceSource ?? "online_manual";
        }
        if (
          (row.sessionType === "online" && source !== "online_manual") ||
          (row.sessionType === "in_person" && source === "online_manual")
        )
          visitError("visitPresenceSourceInvalid");
        if (row.presenceConfirmedAt && (
          (row.status === "waiting" && !waiting) ||
          (row.status === (waiting ? "waiting" : "checked_in") && row.presenceSource === source)
        )) return this.read(tx, actor, id);
        const now = new Date();
        await tx.appointment.update({
          where: { id },
          data: {
            presenceConfirmedAt:
              row.presenceSource === source
                ? (row.presenceConfirmedAt ?? now)
                : now,
            presenceConfirmedById: actor.clinicUserId,
            presenceSource: source,
            status: waiting ? "waiting" : "checked_in",
            ...(statusReason ? { statusReason } : {}),
            waitingStartedAt: waiting
              ? (row.waitingStartedAt ?? now)
              : row.waitingStartedAt,
            statusUpdatedAt: now,
            statusUpdatedBy: actor.userId,
            revision: { increment: 1 },
          },
        });
        if (row.status !== (waiting ? "waiting" : "checked_in")) arrival = row;
        return this.read(tx, actor, id);
      },
    );
    this.changed(actor.clinicId);
    if (arrival) await this.notifyArrival(actor, arrival);
    return result;
  }
  async start(actor: AuthUser, appointmentId: string, expected?: number, statusReason?: string) {
    this.permit(actor, "clinical");
    const result = await this.repo.withAppointment(
      actor,
      appointmentId,
      async (tx, row) => {
        this.active(row);
        if (row.visit) return workspaceDto(row, actor);
        if (expected !== undefined) this.revision(row.revision, expected);
        if (
          !row.presenceConfirmedAt ||
          (row.sessionType === "online"
            ? row.presenceSource !== "online_manual"
            : row.presenceSource === "online_manual") ||
          !["checked_in", "waiting"].includes(row.status)
        )
          visitError("visitPresenceRequired", 409);
        const live = await tx.visit.findFirst({
          where: {
            clinicId: actor.clinicId,
            finishedAt: null,
            appointmentId: { not: appointmentId },
            appointment: { OR: [
              { doctorId: row.doctorId },
              { patientId: row.patientId },
              ...(row.roomId ? [{ roomId: row.roomId }] : []),
            ] },
          },
          select: { id: true },
        });
        if (live) visitError("visitResourceBusy", 409);
        const now = new Date();
        const end = new Date(
          row.scheduledAt.getTime() + row.durationMins * 60_000,
        );
        const template = await this.templates.defaultForVisit(tx, row);
        await tx.visit.create({
          data: {
            clinicId: actor.clinicId,
            appointmentId,
            startedAt: now,
            scheduledEndAt: end,
            documentationDeadlineAt: new Date(end.getTime() + 48 * 3600_000),
            ...(template ? {
              noteStatus: "draft",
              note: { create: {
                templateId: template.id,
                sectionsSnapshot: toJson(template.sections),
                values: {},
                authorId: actor.clinicUserId,
              } },
            } : {}),
            context: toJson({
              patientName: `${row.patient.firstNameEn} ${row.patient.lastNameEn}`,
              patientNameAr: [row.patient.firstNameAr, row.patient.lastNameAr]
                .filter(Boolean)
                .join(" "),
              practitionerName: row.doctor.name,
              practitionerNameAr: row.doctor.nameAr,
              clinicName: row.clinic.name,
              clinicNameAr: row.clinic.nameAr,
              timezone: row.clinic.timezone,
              mode: row.sessionType,
              scheduledAt: row.scheduledAt.toISOString(),
              durationMins: row.durationMins,
              fee: row.fee?.toString() ?? "0",
              discount: row.discount?.toString() ?? "0",
              discountType: row.discountType,
              packageCoverage: row.packageCredit?.toString() ?? "0",
              prepaid: row.isPaid,
              paymentMethodId: row.paymentMethodId,
              serviceName: row.service?.name ?? "Consultation",
            }),
            events: {
              create: { actorId: actor.clinicUserId, kind: "visit_started" },
            },
          },
        });
        await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            status: "in_progress",
            ...(statusReason ? { statusReason } : {}),
            inProgressAt: now,
            statusUpdatedAt: now,
            statusUpdatedBy: actor.userId,
            waitingMins: row.waitingStartedAt
              ? Math.max(
                  0,
                  Math.floor(
                    (now.getTime() - row.waitingStartedAt.getTime()) / 60000,
                  ),
                )
              : null,
            revision: { increment: 1 },
          },
        });
        return this.read(tx, actor, appointmentId);
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async finish(actor: AuthUser, visitId: string, revision: number) {
    this.permit(actor, "clinical");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        this.active(row);
        if (visit.finishedAt) return workspaceDto(row, actor);
        this.revision(visit.revision, revision);
        const now = new Date();
        await tx.visit.update({
          where: { id: visitId },
          data: {
            finishedAt: now,
            invoiceStatus: "awaiting_review",
            revision: { increment: 1 },
          },
        });
        await tx.appointment.update({
          where: { id: row.id },
          data: {
            status: "completed",
            statusUpdatedAt: now,
            statusUpdatedBy: actor.userId,
            revision: { increment: 1 },
          },
        });
        await this.prepareInvoice(tx, row, visit);
        await this.event(tx, actor, visitId, "visit_finished");
        return this.read(tx, actor, row.id);
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async saveNote(actor: AuthUser, visitId: string, input: NoteDraftDto) {
    this.permit(actor, "clinical");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        this.editable(row, visit);
        this.revision(visit.note?.revision ?? 0, input.revision);
        const switching = visit.note?.templateId !== input.templateId;
        if (switching) {
          const allowed = await this.templates.allowed(tx, row);
          if (!allowed.some((template) => template.id === input.templateId))
            visitError("clinicalTemplateUnavailable", 403);
          if (
            visit.note &&
            Object.keys(visit.note.values as object).length &&
            !input.acknowledgeTemplateChange
          )
            visitError("clinicalTemplateChangeConfirmationRequired", 409);
        }
        const template = await tx.clinicalNoteTemplate.findFirst({
          where: { id: input.templateId, clinicId: actor.clinicId },
        });
        if (!template) visitError("clinicalTemplateNotFound", 404);
        const sections =
          !switching && visit.note
            ? storedClinicalSections(visit.note.sectionsSnapshot)
            : publishedSnapshot(template).sections;
        validateValues(sections, input.values);
        const data = {
          templateId: template.id,
          sectionsSnapshot: toJson(sections),
          values: toJson(input.values),
          authorId: actor.clinicUserId,
          savedAt: new Date(),
        };
        if (visit.note) {
          await this.event(tx, actor, visit.id, "note_revision", {
            revision: visit.note.revision,
            values: visit.note.values,
            sectionsSnapshot: visit.note.sectionsSnapshot,
          });
          await tx.clinicalNote.update({
            where: { id: visit.note.id },
            data: { ...data, revision: { increment: 1 } },
          });
        } else
          await tx.clinicalNote.create({
            data: { ...data, visitId, clinicId: actor.clinicId },
          });
        await tx.visit.update({
          where: { id: visitId },
          data: { noteStatus: "draft", revision: { increment: 1 } },
        });
        return this.read(tx, actor, row.id);
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async signNote(actor: AuthUser, visitId: string, revision: number) {
    this.permit(actor, "clinical");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        if (visit.note?.signedAt && visit.note.revision === revision)
          return workspaceDto(row, actor);
        this.editable(row, visit);
        if (!visit.note || !visit.finishedAt)
          visitError("clinicalNoteNotReady", 409);
        this.revision(visit.note.revision, revision);
        validateValues(
          storedClinicalSections(visit.note.sectionsSnapshot),
          visit.note.values,
          true,
        );
        const event = await this.event(tx, actor, visitId, "note_signed", {
          revision,
          values: visit.note.values,
          sectionsSnapshot: visit.note.sectionsSnapshot,
          templateId: visit.note.templateId,
        });
        await tx.clinicalNote.update({
          where: { id: visit.note.id },
          data: { signedAt: new Date(), signedRevisionId: event.id },
        });
        const report = blankReport();
        const values = visit.note.values as Record<string, unknown>;
        const fields = (
          storedClinicalSections(visit.note.sectionsSnapshot)
        ).flatMap((section) => section.fields);
        for (const key of Object.keys(report) as (keyof ReportSections)[]) {
          const field = fields.find((item) => item.id === key);
          const rule = field?.visibility;
          const visible =
            !rule ||
            (rule.operator === "equals"
              ? values[rule.fieldId] === rule.value
              : values[rule.fieldId] !== rule.value);
          if (field && visible && typeof values[key] === "string")
            report[key] = values[key];
        }
        await tx.visitMedicalReport.create({
          data: {
            visitId,
            clinicId: actor.clinicId,
            sections: toJson(report),
            sourceNoteRevisionId: event.id,
            referenceNumber: newReferenceNumber(),
          },
        });
        await tx.visit.update({
          where: { id: visitId },
          data: {
            noteStatus: "signed",
            reportStatus: "draft",
            unlockGrantedAt: null,
            unlockGrantedById: null,
            unlockReason: null,
            revision: { increment: 1 },
          },
        });
        return this.read(tx, actor, row.id);
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async unlock(
    actor: AuthUser,
    visitId: string,
    reason: string,
    revoke = false,
  ) {
    this.permit(actor, "billing");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        this.active(row);
        if (
          visit.note?.signedAt ||
          (!revoke && !noteLocked(visit)) ||
          (revoke && !visit.unlockGrantedAt)
        )
          visitError("visitInvalidTransition", 409);
        await tx.visit.update({
          where: { id: visitId },
          data: {
            unlockGrantedAt: revoke ? null : new Date(),
            unlockGrantedById: revoke ? null : actor.clinicUserId,
            unlockReason: revoke ? null : reason,
            revision: { increment: 1 },
          },
        });
        await this.event(
          tx,
          actor,
          visitId,
          revoke ? "note_unlock_revoked" : "note_unlocked",
          undefined,
          reason,
        );
        return this.read(tx, actor, row.id);
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async addendum(actor: AuthUser, visitId: string, input: AddendumDto) {
    this.permit(actor, "clinical");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        if (!visit.note?.signedAt) visitError("clinicalNoteNotReady", 409);
        await this.event(
          tx,
          actor,
          visitId,
          "note_addendum",
          {
            text: input.text,
            sourceSignedRevisionId: visit.note.signedRevisionId,
          },
          input.reason,
        );
        await tx.visit.update({
          where: { id: visitId },
          data: { revision: { increment: 1 } },
        });
        return this.read(tx, actor, row.id);
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async history(actor: AuthUser, visitId: string, query: VisitHistoryQueryDto) {
    this.permit(actor, "read");
    if (actor.role !== "owner" && actor.role !== "practitioner") visitError("visitForbidden", 403);
    return this.repo.withVisit(actor, visitId, async (tx) => {
      const where = {
        visitId,
        clinicId: actor.clinicId,
        kind: { startsWith: "note_" },
      };
      const [rows, total] = await Promise.all([
        tx.visitEvent.findMany({
          where,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        tx.visitEvent.count({ where }),
      ]);
      return {
        items: rows.map(eventDto),
        total,
        page: query.page,
        limit: query.limit,
      };
    });
  }

  async report(actor: AuthUser, visitId: string) {
    if (!["owner", "practitioner"].includes(actor.role))
      visitError("visitForbidden", 403);
    return this.repo.withVisit(actor, visitId, async (_tx, row) => {
      const report = workspaceDto(row, actor).report;
      if (!report) visitError("visitReportNotReady", 409);
      return report;
    });
  }

  async saveReport(actor: AuthUser, visitId: string, input: ReportDraftDto) {
    this.permit(actor, "clinical");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        if (!visit.note?.signedAt || !visit.report || visit.report.signedAt)
          visitError("visitReportNotReady", 409);
        this.revision(visit.report.revision, input.revision);
        await tx.visitMedicalReport.update({
          where: { id: visit.report.id },
          data: {
            sections: toJson(input.sections),
            ...(input.details &&
              reportDetailsData(normalizeReportDetails(input.details))),
            revision: { increment: 1 },
          },
        });
        await tx.visit.update({
          where: { id: visitId },
          data: { revision: { increment: 1 } },
        });
        return (await this.read(tx, actor, row.id)).report;
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  private documentSnapshot(
    row: WorkspaceRow,
    title: string,
    sections: { label: string; value: string }[],
  ): VisitDocumentSnapshot {
    const context = row.visit!.context as Record<string, string>;
    const arabic = getLocale() === "ar";
    const copy = getSharedTranslations(getLocale()).documents;
    const labels: Record<string, string> = copy.labels;
    return {
      title: arabic
        ? title.startsWith("Invoice ")
          ? title.replace("Invoice ", copy.invoicePrefix)
          : title.includes("amended")
            ? copy.amendedReport
            : copy.medicalReport
        : title,
      clinicName: arabic
        ? context.clinicNameAr || context.clinicName
        : context.clinicName,
      brandColor: row.clinic.brandColor,
      logoUrl: row.clinic.logoUrl,
      footer: row.clinic.letterheadFooter,
      patientName: arabic
        ? context.patientNameAr || context.patientName
        : context.patientName,
      practitionerName: arabic
        ? context.practitionerNameAr || context.practitionerName
        : context.practitionerName,
      timezone: context.timezone,
      issuedAt: new Date().toISOString(),
      sections: sections.map((section) => ({
        ...section,
        label: arabic
          ? (labels[section.label] ?? section.label)
          : section.label,
      })),
    };
  }

  async signReport(
    actor: AuthUser,
    visitId: string,
    revision: number,
    amendment?: ReportAmendDto,
  ) {
    this.permit(actor, "clinical");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        if (
          !visit.note?.signedAt ||
          !visit.report ||
          (amendment && !visit.report.signedAt)
        )
          visitError("visitReportNotReady", 409);
        this.revision(visit.report.revision, revision);
        if (visit.report.signedAt && !amendment)
          return workspaceDto(row, actor).report;
        const sections =
          amendment?.sections ??
          storedReportSections(visit.report.sections);
        if (
          !sections.reason.trim() ||
          !sections.summary.trim() ||
          !sections.plan.trim()
        )
          visitError("visitReportIncomplete");
        const details = normalizeReportDetails(
          amendment?.details ?? storedReportDetails(visit.report),
        );
        assertReportDetails(details);
        const nextRevision = amendment ? revision + 1 : revision;
        const copy = getSharedTranslations(getLocale()).documents;
        const detailRows = [
          { label: copy.labels.reportType, value: copy.reportTypes[details.reportType] },
          ...(details.reportType === REPORT_TYPE.SICK_LEAVE
            ? [
                {
                  label: copy.labels.restPeriod,
                  value: `${details.restFrom} - ${details.restTo}`,
                },
                {
                  label: copy.labels.restDays,
                  value: String(restDays(details)),
                },
              ]
            : []),
          ...(details.purpose
            ? [{ label: copy.labels.purpose, value: details.purpose }]
            : []),
          {
            label: copy.labels.referenceNumber,
            value: visit.report.referenceNumber,
          },
        ];
        const snapshot = this.documentSnapshot(
          row,
          amendment ? "Medical report - amended" : "Medical report",
          [
            ...detailRows,
            ...Object.entries(sections).map(([label, value]) => ({
              label,
              value,
            })),
          ],
        );
        const pdf = await this.documents.render(snapshot);
        await tx.visitDocument.create({
          data: {
            clinicId: actor.clinicId,
            visitId,
            kind: "medical_report",
            revision: nextRevision,
            snapshot: toJson(snapshot),
            pdf: new Uint8Array(pdf),
            signedById: actor.clinicUserId,
          },
        });
        if (amendment)
          await tx.visitDocument.updateMany({
            where: { visitId, kind: "medical_report", revision: { lt: nextRevision } },
            data: { releasedAt: null },
          });
        await tx.visitMedicalReport.update({
          where: { id: visit.report.id },
          data: {
            sections: toJson(sections),
            ...reportDetailsData(details),
            revision: nextRevision,
            signedAt: new Date(),
            signedById: actor.clinicUserId,
          },
        });
        await tx.visit.update({
          where: { id: visitId },
          data: { reportStatus: "signed", revision: { increment: 1 } },
        });
        await this.event(
          tx,
          actor,
          visitId,
          amendment ? "report_amended" : "report_signed",
          { revision: nextRevision },
          amendment?.reason,
        );
        return (await this.read(tx, actor, row.id)).report;
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async invoice(actor: AuthUser, visitId: string) {
    this.permit(actor, "read");
    return this.repo.withVisit(actor, visitId, async (_tx, _row, visit) => {
      const invoice = invoiceDto(visit);
      if (!invoice) visitError("visitInvoiceNotReady", 409);
      return invoice;
    });
  }

  private async prepareInvoice(
    tx: VisitTx,
    row: WorkspaceRow,
    visit: VisitRow,
  ) {
    const context = visit.context as Record<string, string | boolean | null>;
    const subtotal = new Prisma.Decimal(String(context.fee));
    const rawDiscount = new Prisma.Decimal(String(context.discount));
    const discount = Prisma.Decimal.min(
      subtotal,
      context.discountType === "percentage"
        ? subtotal.mul(Prisma.Decimal.min(100, rawDiscount)).div(100)
        : context.discountType === "fixed"
          ? rawDiscount
          : new Prisma.Decimal(0),
    ).toDecimalPlaces(3);
    const coverage = Prisma.Decimal.min(
      subtotal.minus(discount),
      new Prisma.Decimal(String(context.packageCoverage)),
    );
    const total = Prisma.Decimal.max(
      0,
      subtotal.minus(discount).minus(coverage),
    );
    await tx.visitInvoice.create({
      data: {
        clinicId: row.clinicId,
        visitId: visit.id,
        subtotal,
        discount,
        total,
        packageCoverage: coverage,
        prepayment: context.prepaid ? total : 0,
        lineItems: toJson([
          {
            id: "consultation",
            description: context.serviceName,
            quantity: "1",
            unitPrice: subtotal.toFixed(3),
            total: subtotal.toFixed(3),
          },
        ]),
      },
    });
  }
  private priceInvoice(
    input: InvoiceDraftDto,
    current: NonNullable<VisitRow["invoice"]>,
    paid: Prisma.Decimal,
  ) {
    if (
      new Set(input.lineItems.map((line) => line.id)).size !==
      input.lineItems.length
    )
      visitError("visitInvoiceInvalid");
    const lineItems: InvoiceLine[] = input.lineItems.map((line) => {
      const quantity = new Prisma.Decimal(line.quantity);
      if (!quantity.gt(0)) visitError("visitInvoiceInvalid");
      return {
        ...line,
        total: quantity.mul(line.unitPrice).toDecimalPlaces(3).toFixed(3),
      };
    });
    const subtotal = lineItems.reduce(
      (sum, line) => sum.plus(line.total),
      new Prisma.Decimal(0),
    );
    const discount = new Prisma.Decimal(
      input.discount ?? current.discount.toString(),
    );
    const tax = new Prisma.Decimal(input.tax ?? current.tax.toString());
    const total = subtotal
      .minus(discount)
      .plus(tax)
      .minus(current.packageCoverage)
      .toDecimalPlaces(3);
    if (
      discount.gt(subtotal) ||
      subtotal.gt(999999999) ||
      total.lt(paid) ||
      total.gt(999999999)
    )
      visitError("visitInvoiceInvalid");
    return { lineItems, subtotal, discount, tax, total };
  }
  async saveInvoice(actor: AuthUser, visitId: string, input: InvoiceDraftDto) {
    this.permit(actor, "billing");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        if (!visit.finishedAt || !visit.invoice || visit.invoice.issuedAt)
          visitError("visitInvoiceNotReady", 409);
        this.revision(visit.invoice.revision, input.revision);
        const { lineItems, subtotal, discount, tax, total } = this.priceInvoice(
          input,
          visit.invoice,
          visit.invoice.prepayment,
        );
        await tx.visitInvoice.update({
          where: { id: visit.invoice.id },
          data: {
            lineItems: toJson(lineItems),
            subtotal,
            discount,
            tax,
            total,
            revision: { increment: 1 },
          },
        });
        await this.event(tx, actor, visitId, "invoice_reviewed", {
          revision: input.revision + 1,
        });
        return invoiceDto(
          (await this.repo.appointment(tx, actor, row.id)).visit!,
        );
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async feedback(actor: AuthUser, visitId: string, message: string) {
    this.permit(actor, "clinical");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        if (!visit.invoice) visitError("visitInvoiceNotReady", 409);
        await this.event(tx, actor, visitId, "invoice_feedback", { message });
        await tx.visitInvoice.update({
          where: { id: visit.invoice.id },
          data: { revision: { increment: 1 } },
        });
        return invoiceDto(
          (await this.repo.appointment(tx, actor, row.id)).visit!,
        );
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async resolveFeedback(
    actor: AuthUser,
    visitId: string,
    feedbackId: string,
    reason: string,
  ) {
    this.permit(actor, "billing");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        if (
          !visit.invoice ||
          !visit.events.some(
            (event) =>
              event.id === feedbackId && event.kind === "invoice_feedback",
          )
        )
          visitError("visitNotFound", 404);
        if (
          !invoiceDto(visit)!.feedback.find((item) => item.id === feedbackId)
            ?.resolvedAt
        ) {
          await this.event(
            tx,
            actor,
            visitId,
            "invoice_feedback_resolved",
            { feedbackId },
            reason,
          );
          await tx.visitInvoice.update({
            where: { id: visit.invoice.id },
            data: { revision: { increment: 1 } },
          });
        }
        return invoiceDto(
          (await this.repo.appointment(tx, actor, row.id)).visit!,
        );
      },
    );
    this.changed(actor.clinicId);
    return result;
  }

  async issueInvoice(actor: AuthUser, visitId: string, revision: number) {
    this.permit(actor, "billing");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        const invoice = visit.invoice;
        if (!visit.finishedAt || !invoice)
          visitError("visitInvoiceNotReady", 409);
        if (invoice.issuedAt) return invoiceDto(visit);
        this.revision(invoice.revision, revision);
        const number = `INV-${new Date().getUTCFullYear()}-${invoice.id.toUpperCase()}`;
        const lines = storedInvoiceLines(invoice.lineItems);
        const snapshot = this.documentSnapshot(row, `Invoice ${number}`, [
          ...lines.map((line) => ({
            label: line.description,
            value: `${line.quantity} x ${line.unitPrice} = ${line.total} ${invoice.currency}`,
          })),
          ...[
            "subtotal",
            "discount",
            "tax",
            "packageCoverage",
            "prepayment",
            "total",
          ].map((key) => ({
            label: key,
            value: `${String(invoice[key as keyof typeof invoice])} ${invoice.currency}`,
          })),
          {
            label: "paid",
            value: `${invoice.prepayment.toFixed(3)} ${invoice.currency}`,
          },
          {
            label: "balance",
            value: `${invoice.total.minus(invoice.prepayment).toFixed(3)} ${invoice.currency}`,
          },
        ]);
        await tx.visitDocument.create({
          data: {
            clinicId: actor.clinicId,
            visitId,
            kind: "invoice",
            revision: invoice.revision,
            snapshot: toJson(snapshot),
            pdf: new Uint8Array(await this.documents.render(snapshot)),
            signedById: actor.clinicUserId,
          },
        });
        await tx.visitInvoice.update({
          where: { id: invoice.id },
          data: { number, issuedAt: new Date(), revision: { increment: 1 } },
        });
        await tx.visit.update({
          where: { id: visitId },
          data: { invoiceStatus: "issued", revision: { increment: 1 } },
        });
        await this.event(tx, actor, visitId, "invoice_issued", { number });
        return invoiceDto(
          (await this.repo.appointment(tx, actor, row.id)).visit!,
        );
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async payment(
    actor: AuthUser,
    invoiceId: string,
    input: PaymentDto | ReversalDto,
    reverse = false,
  ) {
    this.permit(actor, "billing");
    const invoice = await this.repo.db.visitInvoice.findFirst({
      where: { id: invoiceId, clinicId: actor.clinicId },
      select: { visitId: true },
    });
    if (!invoice) visitError("visitNotFound", 404);
    const hash = createHash("sha256")
      .update(
        JSON.stringify({
          invoiceId,
          reverse,
          amount: new Prisma.Decimal(input.amount).toFixed(3),
          expectedRevision: input.expectedRevision,
          methodId: "methodId" in input ? input.methodId : null,
          paymentId: "paymentId" in input ? input.paymentId : null,
          reference: "reference" in input ? (input.reference ?? null) : null,
          reason: input.reason ?? null,
        }),
      )
      .digest("hex");
    const result = await this.repo.withVisit(
      actor,
      invoice.visitId,
      async (tx, row, visit) => {
        const previous = await tx.visitPayment.findUnique({
          where: {
            clinicId_requestId: {
              clinicId: actor.clinicId,
              requestId: input.requestId,
            },
          },
        });
        if (previous) {
          if (previous.requestHash !== hash)
            visitError("visitIdempotencyConflict", 409);
          return invoiceDto(visit);
        }
        const current = visit.invoice;
        if (!current?.issuedAt || current.voidedAt)
          visitError("visitInvoiceNotReady", 409);
        this.revision(current.revision, input.expectedRevision);
        const amount = new Prisma.Decimal(input.amount);
        if (!amount.gt(0)) visitError("visitPaymentInvalid");
        let paymentId: string | undefined;
        let methodId: string | undefined;
        if (reverse) {
          const reversal = input as ReversalDto;
          const payment =
            reversal.paymentId === current.id && current.prepayment.gt(0)
              ? { id: current.id, amount: current.prepayment }
              : current.payments.find(
                  (item) => item.id === reversal.paymentId && item.amount.gt(0),
                );
          if (!payment) visitError("visitPaymentInvalid");
          const reversed = current.payments
            .filter((item) => item.paymentId === payment.id)
            .reduce(
              (sum, item) => sum.plus(item.amount.abs()),
              new Prisma.Decimal(0),
            );
          if (amount.gt(payment.amount.minus(reversed)))
            visitError("visitPaymentInvalid");
          paymentId = payment.id;
        } else {
          methodId = (input as PaymentDto).methodId;
          if (
            !(await tx.paymentMethod.count({
              where: { id: methodId, clinicId: actor.clinicId, isActive: true },
            }))
          )
            visitError("visitPaymentInvalid");
          if (amount.gt(invoiceDto(visit)!.balance))
            visitError("visitPaymentInvalid");
        }
        await tx.visitPayment.create({
          data: {
            clinicId: actor.clinicId,
            invoiceId,
            requestId: input.requestId,
            requestHash: hash,
            amount: reverse ? amount.negated() : amount,
            actorId: actor.clinicUserId,
            methodId,
            paymentId,
            reference: "reference" in input ? input.reference : undefined,
            reason: input.reason,
          },
        });
        await tx.visitInvoice.update({
          where: { id: invoiceId },
          data: { revision: { increment: 1 } },
        });
        await this.event(
          tx,
          actor,
          visit.id,
          reverse ? "payment_reversed" : "payment_recorded",
          { amount: amount.toFixed(3), paymentId, requestId: input.requestId },
          input.reason,
        );
        return invoiceDto(
          (await this.repo.appointment(tx, actor, row.id)).visit!,
        );
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async correctInvoice(
    actor: AuthUser,
    visitId: string,
    input: InvoiceCorrectionDto,
  ) {
    this.permit(actor, "billing");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        const current = visit.invoice;
        if (!current?.issuedAt || current.voidedAt)
          visitError("visitInvoiceNotReady", 409);
        this.revision(current.revision, input.revision);
        const {
          lineItems: lines,
          subtotal,
          discount,
          tax,
          total,
        } = this.priceInvoice(
          input,
          current,
          new Prisma.Decimal(invoiceDto(visit)!.paid),
        );
        const revision = current.revision + 1;
        const number = `${current.number!.split("-R")[0]}-R${revision}`;
        const snapshot = this.documentSnapshot(row, `Invoice ${number}`, [
          ...lines.map((line) => ({
            label: line.description,
            value: `${line.quantity} x ${line.unitPrice} = ${line.total} ${current.currency}`,
          })),
          { label: "Correction reason", value: input.reason },
          ...Object.entries({
            subtotal,
            discount,
            tax,
            packageCoverage: current.packageCoverage,
            prepayment: current.prepayment,
            total,
            paid: new Prisma.Decimal(invoiceDto(visit)!.paid),
            balance: total.minus(invoiceDto(visit)!.paid),
          }).map(([label, value]) => ({
            label,
            value: `${value.toFixed(3)} ${current.currency}`,
          })),
        ]);
        await tx.visitDocument.create({
          data: {
            clinicId: actor.clinicId,
            visitId,
            kind: "invoice",
            revision,
            snapshot: toJson(snapshot),
            pdf: new Uint8Array(await this.documents.render(snapshot)),
            signedById: actor.clinicUserId,
          },
        });
        await tx.visitDocument.updateMany({
          where: { visitId, kind: "invoice", revision: { lt: revision } },
          data: { releasedAt: null },
        });
        await tx.visitInvoice.update({
          where: { id: current.id },
          data: {
            lineItems: toJson(lines),
            subtotal,
            discount,
            tax,
            total,
            revision,
            number,
          },
        });
        await this.event(
          tx,
          actor,
          visitId,
          "invoice_corrected",
          { previous: invoiceDto(visit), number, revision },
          input.reason,
        );
        return invoiceDto(
          (await this.repo.appointment(tx, actor, row.id)).visit!,
        );
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async voidInvoice(
    actor: AuthUser,
    visitId: string,
    revision: number,
    reason: string,
  ) {
    this.permit(actor, "billing");
    const result = await this.repo.withVisit(
      actor,
      visitId,
      async (tx, row, visit) => {
        if (
          !visit.invoice?.issuedAt ||
          visit.invoice.voidedAt ||
          new Prisma.Decimal(invoiceDto(visit)!.paid).gt(0)
        )
          visitError("visitInvoiceNotReady", 409);
        this.revision(visit.invoice.revision, revision);
        await tx.visitInvoice.update({
          where: { id: visit.invoice.id },
          data: { voidedAt: new Date(), revision: { increment: 1 } },
        });
        await tx.visitDocument.updateMany({
          where: { visitId, kind: "invoice" },
          data: { releasedAt: null },
        });
        await tx.visit.update({
          where: { id: visitId },
          data: { invoiceStatus: "void", revision: { increment: 1 } },
        });
        await this.event(
          tx,
          actor,
          visitId,
          "invoice_voided",
          undefined,
          reason,
        );
        return invoiceDto(
          (await this.repo.appointment(tx, actor, row.id)).visit!,
        );
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async releaseDocument(
    actor: AuthUser,
    id: string,
    released: boolean,
    reason: string,
  ) {
    this.permit(actor, "billing");
    const document = await this.repo.db.visitDocument.findFirst({
      where: { id, clinicId: actor.clinicId },
      select: { visitId: true },
    });
    if (!document) visitError("visitNotFound", 404);
    const result = await this.repo.withVisit(
      actor,
      document.visitId,
      async (tx, row, visit) => {
        const target = visit.documents.find((item) => item.id === id);
        if (
          released &&
          (!target ||
            visit.documents.some(
              (item) => item.kind === target.kind && item.revision > target.revision,
            ) ||
            (target.kind === "invoice" && visit.invoice?.voidedAt))
        )
          visitError("visitInvalidTransition", 409);
        await tx.visitDocument.update({
          where: { id },
          data: { releasedAt: released ? new Date() : null },
        });
        await this.event(
          tx,
          actor,
          document.visitId,
          released ? "document_released" : "document_release_revoked",
          { documentId: id },
          reason,
        );
        return this.read(tx, actor, row.id);
      },
    );
    this.changed(actor.clinicId);
    return result;
  }
  async pdf(actor: AuthUser, visitId: string, kind: string, version?: number) {
    this.permit(actor, "read");
    if (
      kind === "medical_report" &&
      !["owner", "practitioner"].includes(actor.role)
    )
      visitError("visitForbidden", 403);
    return this.repo.withVisit(actor, visitId, async (tx) => {
      const document = await tx.visitDocument.findFirst({
        where: {
          visitId,
          clinicId: actor.clinicId,
          kind,
          ...(version !== undefined && { revision: version }),
        },
        orderBy: { revision: "desc" },
      });
      if (!document) visitError("visitDocumentNotReady", 409);
      return {
        buffer: Buffer.from(document.pdf),
        filename: `${kind}-${visitId}-v${document.revision}.pdf`,
      };
    });
  }
}
