import { SHARED_EN, SHARED_AR } from './i18n/index';
import type { AppointmentStatus, SessionType } from "./enums";
import type { ClinicalSection, ClinicalValue } from "./form";
export type NoteStatus =
  "not_started" | "draft" | "signed" | "locked" | "reopened";
export const NOTE_STATUS = {
  NOT_STARTED: "not_started",
  DRAFT: "draft",
  SIGNED: "signed",
  LOCKED: "locked",
  REOPENED: "reopened",
} as const satisfies Record<string, NoteStatus>;
export type VisitReportStatus = "pending_note" | "draft" | "signed";
export const VISIT_REPORT_STATUS = {
  PENDING_NOTE: "pending_note",
  DRAFT: "draft",
  SIGNED: "signed",
} as const satisfies Record<string, VisitReportStatus>;
export type InvoiceStatus = "preparing" | "awaiting_review" | "issued" | "void";
export const INVOICE_STATUS = {
  PREPARING: "preparing",
  AWAITING_REVIEW: "awaiting_review",
  ISSUED: "issued",
  VOID: "void",
} as const satisfies Record<string, InvoiceStatus>;
export type InvoicePaymentStatus = "unpaid" | "partial" | "paid";
export const INVOICE_PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PARTIAL: "partial",
  PAID: "paid",
} as const satisfies Record<string, InvoicePaymentStatus>;
export type PresenceSource = "front_desk" | "online_manual" | "practitioner";
export const PRESENCE_SOURCE = {
  FRONT_DESK: "front_desk",
  ONLINE_MANUAL: "online_manual",
  PRACTITIONER: "practitioner",
} as const satisfies Record<string, PresenceSource>;
export interface VisitSummary {
  appointmentId: string;
  visitId: string | null;
  patient: { id: string; name: string; nameAr: string | null; imageUrl: string | null };
  practitioner: { id: string; name: string; nameAr: string | null; imageUrl: string | null };
  service: { name: string; nameAr: string | null } | null;
  room: { id: string; name: string; nameAr: string | null } | null;
  mode: SessionType;
  scheduledAt: string;
  durationMins: number;
  appointmentStatus: AppointmentStatus;
  appointmentRevision: number;
  noteStatus: NoteStatus;
  reportStatus: VisitReportStatus;
  invoiceStatus: InvoiceStatus;
  startedAt: string | null;
  finishedAt: string | null;
  documentationDeadlineAt: string | null;
}
export type VisitQueue =
  | "not_started"
  | "in_progress"
  | "documentation_pending"
  | "locked"
  | "report_pending"
  | "invoice_review"
  | "completed";
export const VISIT_QUEUE = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  DOCUMENTATION_PENDING: "documentation_pending",
  LOCKED: "locked",
  REPORT_PENDING: "report_pending",
  INVOICE_REVIEW: "invoice_review",
  COMPLETED: "completed",
} as const satisfies Record<string, VisitQueue>;
export interface VisitListQuery {
  queue?: VisitQueue;
  from?: string;
  to?: string;
  practitionerId?: string;
  appointmentStatus?: string;
  noteStatus?: NoteStatus;
  reportStatus?: VisitReportStatus;
  invoiceStatus?: InvoiceStatus;
  search?: string;
  page?: number;
  limit?: number;
}
export interface VisitListResponse {
  items: VisitSummary[];
  total: number;
  page: number;
  limit: number;
  serverNow: string;
}
export interface VisitAuditEvent {
  id: string;
  kind: string;
  actorId: string;
  reason: string | null;
  createdAt: string;
  snapshot: unknown;
}
export interface ClinicalNoteDTO {
  id: string;
  visitId: string;
  templateId: string;
  sectionsSnapshot: ClinicalSection[];
  values: Record<string, ClinicalValue>;
  status: NoteStatus;
  revision: number;
  authorId: string;
  savedAt: string;
  signedAt: string | null;
  signedRevisionId: string | null;
  lockedAt: string | null;
  unlockGrant: {
    grantedAt: string;
    grantedById: string;
    reason: string;
  } | null;
  addenda: VisitAuditEvent[];
}
export const REPORT_SECTION = {
  REASON: "reason",
  SUMMARY: "summary",
  ASSESSMENT: "assessment",
  PLAN: "plan",
  FOLLOW_UP: "followUp",
} as const;
export type ReportSectionKey =
  (typeof REPORT_SECTION)[keyof typeof REPORT_SECTION];
export const REPORT_TYPE = {
  GENERAL: "general",
  SICK_LEAVE: "sick_leave",
  INSURANCE: "insurance",
  REFERRAL: "referral",
} as const;
export type ReportType = (typeof REPORT_TYPE)[keyof typeof REPORT_TYPE];
export interface ReportDetails {
  reportType: ReportType;
  restFrom: string | null;
  restTo: string | null;
  purpose: string;
}
export interface ReportSections {
  reason: string;
  summary: string;
  assessment: string;
  plan: string;
  followUp: string;
}
export interface VisitReportDTO {
  id: string;
  visitId: string;
  status: VisitReportStatus;
  revision: number;
  sections: ReportSections;
  sourceNoteRevisionId: string;
  signedById: string | null;
  signedAt: string | null;
  pdfAvailable: boolean;
  details: ReportDetails;
  referenceNumber: string;
  versions: {
    id: string;
    revision: number;
    signedAt: string;
    releasedAt: string | null;
  }[];
}
export interface InvoiceLineInput {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}
export interface InvoiceLine extends InvoiceLineInput {
  total: string;
}
export interface InvoiceDTO {
  id: string;
  visitId: string;
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  number: string | null;
  currency: string;
  lineItems: InvoiceLine[];
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  paid: string;
  balance: string;
  packageCoverage: string;
  prepayment: string;
  revision: number;
  issuedAt: string | null;
  pdfAvailable: boolean;
  versions: {
    id: string;
    revision: number;
    signedAt: string;
    releasedAt: string | null;
  }[];
  feedback: InvoiceFeedbackDTO[];
  payments: {
    id: string;
    amount: string;
    methodId: string | null;
    paymentId: string | null;
    reference: string | null;
    reason: string | null;
    createdAt: string;
  }[];
}
export interface VisitActions {
  start: boolean;
  finish: boolean;
  editNote: boolean;
  signNote: boolean;
  unlockNote: boolean;
  revokeUnlock: boolean;
  addAddendum: boolean;
  editReport: boolean;
  signReport: boolean;
  amendReport: boolean;
  reviewInvoice: boolean;
  issueInvoice: boolean;
  recordPayment: boolean;
  reversePayment: boolean;
  correctInvoice: boolean;
  voidInvoice: boolean;
  resolveInvoiceFeedback: boolean;
  releaseDocument: boolean;
  flagDiscrepancy: boolean;
  confirmPresence: boolean;
}
export interface VisitWorkspace extends VisitSummary {
  serverNow: string;
  clinicTimezone: string;
  visitRevision: number;
  meetingUrl: string | null;
  presenceConfirmedAt: string | null;
  documentationUnlock: {
    grantedAt: string;
    grantedById: string;
    reason: string;
  } | null;
  patientContext: {
    phone: string | null;
    dob: string | null;
    gender: string | null;
    allergies: string | null;
    bloodType: string | null;
  } | null;
  note: ClinicalNoteDTO | null;
  report: VisitReportDTO | null;
  invoice: InvoiceDTO | null;
  allowedActions: VisitActions;
}
export interface RevisionInput {
  expectedRevision: number;
}
export interface NoteDraftInput {
  templateId: string;
  values: Record<string, ClinicalValue>;
  revision: number;
  acknowledgeTemplateChange?: boolean;
}
export interface SignInput {
  revision: number;
}
export interface ReportDraftInput {
  sections: ReportSections;
  details?: ReportDetails;
  revision: number;
}
export interface ReportAmendInput extends ReportDraftInput {
  reason: string;
}
export interface InvoiceDraftInput {
  lineItems: InvoiceLineInput[];
  discount?: string;
  tax?: string;
  revision: number;
}
export interface VisitPaymentInput {
  amount: string;
  methodId: string;
  requestId: string;
  expectedRevision: number;
  reference?: string;
  reason?: string;
}
export interface VisitReversalInput {
  paymentId: string;
  amount: string;
  reason: string;
  requestId: string;
  expectedRevision: number;
}
export interface NotePreference {
  templateId: string | null;
  effectiveTemplateId?: string | null;
  clinicTemplateId?: string | null;
}

export const VISIT_ERROR_MESSAGES = Object.fromEntries(Object.keys(SHARED_EN.visitErrors).map((key) => [key, { en: SHARED_EN.visitErrors[key as keyof typeof SHARED_EN.visitErrors], ar: SHARED_AR.visitErrors[key as keyof typeof SHARED_AR.visitErrors] }])) as { [K in keyof typeof SHARED_EN.visitErrors]: { en: string; ar: string } };
export type VisitErrorCode = keyof typeof VISIT_ERROR_MESSAGES;

export interface InvoiceFeedbackDTO {
  id: string;
  message: string;
  actorId: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedById: string | null;
  resolution: string | null;
}
export interface VisitHistoryResponse {
  items: VisitAuditEvent[];
  total: number;
  page: number;
  limit: number;
}

export interface InvoiceCorrectionInput extends InvoiceDraftInput {
  reason: string;
}
