import { Prisma } from "@prisma/client";
import type { AuthUser } from "@/modules/auth/types";
import type {
  ClinicalNoteDTO,
  ClinicalSection,
  ClinicalValue,
  InvoiceDTO,
  InvoiceLine,
  ReportSections,
  VisitAuditEvent,
  VisitReportDTO,
  VisitSummary,
  VisitWorkspace,
} from "@clinic/types";
import type { SummaryRow, VisitRow, WorkspaceRow } from "./visits.repository";
const iso = (date: Date | null | undefined) => date?.toISOString() ?? null;
export const noteLocked = (
  visit: Pick<VisitRow, "documentationDeadlineAt" | "unlockGrantedAt"> & {
    note: { signedAt: Date | null } | null;
  },
  now = new Date(),
) =>
  !visit.note?.signedAt &&
  !visit.unlockGrantedAt &&
  now >= visit.documentationDeadlineAt;
export const eventDto = (
  event: VisitRow["events"][number],
): VisitAuditEvent => ({
  id: event.id,
  kind: event.kind,
  actorId: event.actorId,
  reason: event.reason,
  snapshot: event.snapshot,
  createdAt: event.createdAt.toISOString(),
});
export function invoiceDto(visit: VisitRow): InvoiceDTO | null {
  const invoice = visit.invoice;
  if (!invoice) return null;
  const paid = invoice.payments.reduce(
    (sum, payment) => sum.plus(payment.amount),
    invoice.prepayment,
  );
  const balance = Prisma.Decimal.max(0, invoice.total.minus(paid));
  return {
    id: invoice.id,
    visitId: visit.id,
    status: visit.invoiceStatus as InvoiceDTO["status"],
    paymentStatus: balance.isZero()
      ? "paid"
      : paid.gt(0)
        ? "partial"
        : "unpaid",
    number: invoice.number,
    currency: invoice.currency,
    lineItems: invoice.lineItems as unknown as InvoiceLine[],
    subtotal: invoice.subtotal.toFixed(3),
    discount: invoice.discount.toFixed(3),
    tax: invoice.tax.toFixed(3),
    total: invoice.total.toFixed(3),
    packageCoverage: invoice.packageCoverage.toFixed(3),
    prepayment: invoice.prepayment.toFixed(3),
    paid: paid.toFixed(3),
    balance: balance.toFixed(3),
    revision: invoice.revision,
    issuedAt: iso(invoice.issuedAt),
    pdfAvailable: !!invoice.issuedAt,
    versions: visit.documents
      .filter((document) => document.kind === "invoice")
      .map((document) => ({
        id: document.id,
        revision: document.revision,
        signedAt: document.signedAt.toISOString(),
        releasedAt: iso(document.releasedAt),
      })),
    feedback: visit.events
      .filter((event) => event.kind === "invoice_feedback")
      .map((event) => {
        const resolution = visit.events.find(
          (item) =>
            item.kind === "invoice_feedback_resolved" &&
            (item.snapshot as Record<string, unknown> | null)?.feedbackId ===
              event.id,
        );
        return {
          id: event.id,
          message: String((event.snapshot as Record<string, unknown>).message),
          actorId: event.actorId,
          createdAt: event.createdAt.toISOString(),
          resolvedAt: resolution?.createdAt.toISOString() ?? null,
          resolvedById: resolution?.actorId ?? null,
          resolution: resolution?.reason ?? null,
        };
      }),
    payments: [
      ...(invoice.prepayment.gt(0)
        ? [
            {
              id: invoice.id,
              amount: invoice.prepayment.toFixed(3),
              methodId: (visit.context as Record<string, string | null>)
                .paymentMethodId,
              paymentId: null,
              reference: "Appointment prepayment",
              reason: null,
              createdAt: visit.startedAt.toISOString(),
            },
          ]
        : []),
      ...invoice.payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount.toFixed(3),
        methodId: payment.methodId,
        paymentId: payment.paymentId,
        reference: payment.reference,
        reason: payment.reason,
        createdAt: payment.createdAt.toISOString(),
      })),
    ],
  };
}
export function summary(
  row: WorkspaceRow | SummaryRow,
  now = new Date(),
): VisitSummary {
  const visit = row.visit;
  return {
    appointmentId: row.id,
    visitId: visit?.id ?? null,
    patient: {
      id: row.patientId,
      imageUrl: row.patient.imageUrl,
      name: `${row.patient.firstNameEn} ${row.patient.lastNameEn}`,
      nameAr:
        [row.patient.firstNameAr, row.patient.lastNameAr]
          .filter(Boolean)
          .join(" ") || null,
    },
    practitioner: {
      id: row.doctorId,
      name: row.doctor.name,
      nameAr: row.doctor.nameAr,
    },
    mode: row.sessionType,
    scheduledAt: row.scheduledAt.toISOString(),
    durationMins: row.durationMins,
    appointmentStatus: row.status,
    appointmentRevision: row.revision,
    noteStatus: visit
      ? noteLocked(visit, now)
        ? "locked"
        : visit.unlockGrantedAt && !visit.note?.signedAt
          ? "reopened"
          : (visit.noteStatus as VisitSummary["noteStatus"])
      : "not_started",
    reportStatus: (visit?.reportStatus ??
      "pending_note") as VisitSummary["reportStatus"],
    invoiceStatus: (visit?.invoiceStatus ??
      "preparing") as VisitSummary["invoiceStatus"],
    startedAt: iso(visit?.startedAt),
    finishedAt: iso(visit?.finishedAt),
    documentationDeadlineAt: iso(visit?.documentationDeadlineAt),
  };
}
export function workspaceDto(
  row: WorkspaceRow,
  actor: AuthUser,
  now = new Date(),
): VisitWorkspace {
  const visit = row.visit;
  const doctor =
    actor.role === "practitioner" && actor.clinicUserId === row.doctorId;
  const owner = actor.role === "owner";
  const clinical = doctor;
  const live = !!visit && !visit.finishedAt;
  const active = !["cancelled", "no_show"].includes(row.status);
  const writable =
    !!visit && active && !visit.note?.signedAt && !noteLocked(visit, now);
  const note: ClinicalNoteDTO | null =
    clinical && visit?.note
      ? {
          id: visit.note.id,
          visitId: visit.id,
          templateId: visit.note.templateId,
          templateVersionId: visit.note.templateVersionId,
          templateVersion: visit.note.templateVersion,
          sectionsSnapshot: visit.note
            .sectionsSnapshot as unknown as ClinicalSection[],
          values: visit.note.values as Record<string, ClinicalValue>,
          status: summary(row, now).noteStatus,
          revision: visit.note.revision,
          authorId: visit.note.authorId,
          savedAt: visit.note.savedAt.toISOString(),
          signedAt: iso(visit.note.signedAt),
          signedRevisionId: visit.note.signedRevisionId,
          lockedAt: noteLocked(visit, now)
            ? iso(visit.documentationDeadlineAt)
            : null,
          unlockGrant: visit.unlockGrantedAt
            ? {
                grantedAt: visit.unlockGrantedAt.toISOString(),
                grantedById: visit.unlockGrantedById!,
                reason: visit.unlockReason!,
              }
            : null,
          addenda: visit.events
            .filter((event) => event.kind === "note_addendum")
            .map(eventDto),
        }
      : null;
  const report: VisitReportDTO | null =
    visit?.report && (clinical || (owner && !!visit.report.signedAt))
      ? {
          id: visit.report.id,
          visitId: visit.id,
          revision: visit.report.revision,
          sections: visit.report.sections as unknown as ReportSections,
          status: visit.reportStatus as VisitReportDTO["status"],
          sourceNoteRevisionId: visit.report.sourceNoteRevisionId,
          signedById: visit.report.signedById,
          signedAt: iso(visit.report.signedAt),
          pdfAvailable: !!visit.report.signedAt,
          versions: visit.documents
            .filter((document) => document.kind === "medical_report")
            .map((document) => ({
              id: document.id,
              revision: document.revision,
              signedAt: document.signedAt.toISOString(),
              releasedAt: iso(document.releasedAt),
            })),
        }
      : null;
  const visitSummary = summary(row, now);
  return {
    ...visitSummary,
    practitioner: { ...visitSummary.practitioner, imageUrl: row.doctor.imageUrl },
    serverNow: now.toISOString(),
    clinicTimezone: row.clinic.timezone,
    visitRevision: visit?.revision ?? 0,
    room: row.room
      ? { id: row.room.id, name: row.room.name, nameAr: row.room.nameAr }
      : null,
    meetingUrl:
      doctor || owner || actor.role === "admin"
        ? safeMeetingUrl(row.meetingUrl)
        : null,
    presenceConfirmedAt: iso(row.presenceConfirmedAt),
    documentationUnlock:
      (doctor || owner) && visit?.unlockGrantedAt
        ? {
            grantedAt: visit.unlockGrantedAt.toISOString(),
            grantedById: visit.unlockGrantedById!,
            reason: visit.unlockReason!,
          }
        : null,
    patientContext:
      doctor || owner
        ? {
            phone: row.patient.phone,
            dob: iso(row.patient.dob),
            gender: row.patient.gender,
            allergies: row.patient.allergies,
            bloodType: row.patient.bloodType,
          }
        : null,
    note,
    report,
    invoice: visit ? invoiceDto(visit) : null,
    allowedActions: {
      start:
        doctor &&
        active &&
        !visit &&
        !!row.presenceConfirmedAt &&
        (row.sessionType === "online"
          ? row.presenceSource === "online_manual"
          : row.presenceSource !== "online_manual") &&
        ["checked_in", "waiting"].includes(row.status),
      finish: doctor && live && active,
      editNote: doctor && writable,
      signNote: doctor && writable && !!visit?.finishedAt && !!visit.note,
      unlockNote:
        owner &&
        !!visit &&
        active &&
        !visit.note?.signedAt &&
        noteLocked(visit, now),
      revokeUnlock: owner && !!visit?.unlockGrantedAt && !visit.note?.signedAt,
      addAddendum: doctor && !!visit?.note?.signedAt,
      editReport: doctor && !!visit?.note?.signedAt && !visit?.report?.signedAt,
      signReport:
        doctor &&
        !!visit?.note?.signedAt &&
        !!visit.report &&
        !visit.report.signedAt,
      amendReport: doctor && !!visit?.report?.signedAt,
      reviewInvoice: owner && !!visit?.finishedAt && !visit.invoice?.issuedAt,
      issueInvoice:
        owner &&
        !!visit?.finishedAt &&
        !!visit.invoice &&
        !visit.invoice.issuedAt,
      recordPayment:
        owner &&
        !!visit?.invoice?.issuedAt &&
        !visit.invoice.voidedAt &&
        new Prisma.Decimal(invoiceDto(visit)!.balance).gt(0),
      reversePayment:
        owner &&
        !!visit?.invoice?.issuedAt &&
        !visit.invoice.voidedAt &&
        new Prisma.Decimal(invoiceDto(visit)!.paid).gt(0),
      correctInvoice:
        owner && !!visit?.invoice?.issuedAt && !visit.invoice.voidedAt,
      voidInvoice:
        owner &&
        !!visit?.invoice?.issuedAt &&
        !visit.invoice.voidedAt &&
        new Prisma.Decimal(invoiceDto(visit)!.paid).isZero(),
      resolveInvoiceFeedback: owner && !!visit?.invoice,
      releaseDocument: owner && !!visit?.documents.length,
      flagDiscrepancy: doctor && !!visit?.invoice,
      confirmPresence:
        active &&
        !visit &&
        ["confirmed", "checked_in", "waiting"].includes(row.status) &&
        (owner || actor.role === "admin" || doctor),
    },
  };
}
function safeMeetingUrl(value: string | null) {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
