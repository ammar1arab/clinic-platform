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

export const VISIT_ERROR_MESSAGES = {
  visitRecordRetained: {
    en: "This record has clinical visits. Deactivate it instead of deleting it.",
    ar: "يرتبط هذا السجل بزيارات طبية. عطّله بدلاً من حذفه.",
  },
  visitForbidden: {
    en: "You cannot perform this visit action.",
    ar: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  },
  visitNotFound: {
    en: "Visit or appointment not found.",
    ar: "الزيارة أو الموعد غير موجود.",
  },
  visitRevisionConflict: {
    en: "This record changed. Reload it before saving again.",
    ar: "تغيّر السجل. أعد تحميله قبل الحفظ مجدداً.",
  },
  visitInvalidTransition: {
    en: "This action is not available in the current state.",
    ar: "هذا الإجراء غير متاح في الحالة الحالية.",
  },
  visitInvalidRequest: {
    en: "Invalid visit request.",
    ar: "طلب الزيارة غير صالح.",
  },
  visitInvalidDateRange: {
    en: "The date range is invalid.",
    ar: "نطاق التاريخ غير صالح.",
  },
  visitPresenceRequired: {
    en: "Confirm patient presence before starting.",
    ar: "أكد حضور المريض قبل بدء الزيارة.",
  },
  visitPresenceSourceInvalid: {
    en: "The presence confirmation does not match the appointment mode.",
    ar: "تأكيد الحضور لا يطابق نوع الموعد.",
  },
  visitUseCommands: {
    en: "Use the visit check-in, start or finish command.",
    ar: "استخدم إجراء الوصول أو بدء الزيارة أو إنهائها.",
  },
  visitScheduleFrozen: {
    en: "Started visits require a documented administrative correction.",
    ar: "تعديل موعد بدأت زيارته يتطلب إجراءً إدارياً موثقاً.",
  },
  visitUseClinicalNote: {
    en: "Use the clinical note for clinical documentation.",
    ar: "استخدم الملاحظة الطبية للتوثيق السريري.",
  },
  visitUseInvoice: {
    en: "Manage payment through the visit invoice.",
    ar: "أدر الدفع من فاتورة الزيارة.",
  },
  clinicalTemplateInvalid: {
    en: "The clinical template is invalid.",
    ar: "قالب الملاحظة الطبية غير صالح.",
  },
  clinicalTemplateAssignmentInvalid: {
    en: "Template assignments must belong to this clinic.",
    ar: "يجب أن تنتمي تخصيصات القالب لهذه العيادة.",
  },
  clinicalTemplateInUse: {
    en: "This template is used by saved visit notes and cannot be deleted. Archive it instead.",
    ar: "هذا القالب مستخدم في ملاحظات زيارات محفوظة ولا يمكن حذفه. يمكنك أرشفته بدلًا من ذلك.",
  },
  clinicalTemplateDefaultProtected: {
    en: "Choose another published template for all practitioners as the clinic default before changing this template's audience, making it a draft, scheduling, archiving, or deleting it.",
    ar: "اختر قالباً منشوراً آخر لجميع الممارسين كقالب افتراضي للعيادة قبل تغيير جمهور هذا القالب أو تحويله لمسودة أو جدولته أو أرشفته أو حذفه.",
  },
  clinicalTemplateNotFound: {
    en: "Clinical template not found.",
    ar: "القالب الطبي غير موجود.",
  },
  clinicalTemplateUnavailable: {
    en: "This template is not available for this visit.",
    ar: "هذا القالب غير متاح لهذه الزيارة.",
  },
  clinicalTemplateChangeConfirmationRequired: {
    en: "Confirm replacing the existing draft before changing its template.",
    ar: "أكد استبدال المسودة الحالية قبل تغيير قالبها.",
  },
  clinicalValuesInvalid: {
    en: "One or more clinical field values are invalid.",
    ar: "قيمة أحد الحقول الطبية غير صالحة.",
  },
  clinicalRequiredFieldMissing: {
    en: "Complete the required visible fields before signing.",
    ar: "أكمل الحقول المطلوبة الظاهرة قبل الاعتماد.",
  },
  clinicalNoteAlreadySigned: {
    en: "The note is signed. Add a documented addendum instead.",
    ar: "الملاحظة معتمدة. أضف ملحقاً موثقاً للتصحيح.",
  },
  clinicalNoteLocked: {
    en: "Documentation is locked. Request the owner to reopen it.",
    ar: "التوثيق مقفل. اطلب من المالك إعادة فتحه.",
  },
  clinicalNoteNotReady: {
    en: "Finish the visit and complete its note before signing.",
    ar: "أنه الزيارة وأكمل الملاحظة قبل اعتمادها.",
  },
  visitReportNotReady: {
    en: "The medical report is not ready for this action.",
    ar: "التقرير الطبي غير جاهز لهذا الإجراء.",
  },
  visitReportIncomplete: {
    en: "Complete the report reason, summary and plan before signing.",
    ar: "أكمل سبب الزيارة والخلاصة والخطة قبل اعتماد التقرير.",
  },
  visitInvoiceNotReady: {
    en: "The invoice is not ready for this action.",
    ar: "الفاتورة غير جاهزة لهذا الإجراء.",
  },
  visitInvoiceInvalid: {
    en: "Check invoice items and totals.",
    ar: "تحقق من بنود الفاتورة ومجاميعها.",
  },
  visitPaymentInvalid: {
    en: "The payment amount or payment method is invalid.",
    ar: "مبلغ الدفع أو طريقته غير صالح.",
  },
  visitIdempotencyConflict: {
    en: "This request ID was already used for a different payment.",
    ar: "استُخدم معرف الطلب لدفع مختلف.",
  },
  visitDocumentNotReady: {
    en: "Only finalized documents can be downloaded.",
    ar: "يمكن تنزيل المستندات المعتمدة فقط.",
  },
} as const;
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
