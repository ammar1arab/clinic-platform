import { api } from '@/lib/api';
import { ENDPOINTS } from '@/constants/endpoints';
import type {
  ClinicalNoteDTO,
  InvoiceCorrectionInput,
  InvoiceDraftInput,
  NoteDraftInput,
  PresenceSource,
  NotePreference,
  ReportAmendInput,
  ReportDraftInput,
  SignInput,
  TemplateDTO,
  VisitHistoryResponse,
  VisitListQuery,
  VisitListResponse,
  VisitPaymentInput,
  VisitReportDTO,
  VisitReversalInput,
  VisitWorkspace,
  InvoiceDTO,
} from '@clinic/types';

function filenameFromDisposition(header: string | undefined, fallback: string) {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)"?/i.exec(header);
  if (!match?.[1]) return fallback;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function downloadPdf(path: string, fallbackName: string, revision?: number) {
  const res = await api.get(path, { responseType: 'blob', params: revision ? { revision } : undefined });
  const type = (res.headers['content-type'] as string) || 'application/pdf';
  const blob = new Blob([res.data], { type });
  saveBlob(blob, filenameFromDisposition(res.headers['content-disposition'] as string | undefined, fallbackName));
}

export const visitsService = {
  list: (query: VisitListQuery) =>
    api.get<VisitListResponse>(ENDPOINTS.VISITS.BASE, { params: query }).then((r) => r.data),

  workspace: (appointmentId: string) =>
    api.get<VisitWorkspace>(ENDPOINTS.VISITS.WORKSPACE(appointmentId)).then((r) => r.data),

  checkIn: (appointmentId: string, source: PresenceSource, statusReason?: string) =>
    api.post<VisitWorkspace>(ENDPOINTS.VISITS.CHECK_IN(appointmentId), { source, statusReason }).then((r) => r.data),

  markWaiting: (appointmentId: string, statusReason?: string) =>
    api.post<VisitWorkspace>(ENDPOINTS.VISITS.MARK_WAITING(appointmentId), { statusReason }).then((r) => r.data),

  start: (appointmentId: string, expectedAppointmentRevision?: number, statusReason?: string) =>
    api.post<VisitWorkspace>(ENDPOINTS.VISITS.START(appointmentId), { expectedAppointmentRevision, statusReason }).then((r) => r.data),

  finish: (visitId: string, expectedRevision: number) =>
    api.post<VisitWorkspace>(ENDPOINTS.VISITS.FINISH(visitId), { expectedRevision }).then((r) => r.data),

  saveNote: (visitId: string, body: NoteDraftInput) =>
    api.put<VisitWorkspace>(ENDPOINTS.VISITS.NOTE_DRAFT(visitId), body).then((r) => r.data),

  signNote: (visitId: string, body: SignInput) =>
    api.post<VisitWorkspace>(ENDPOINTS.VISITS.NOTE_SIGN(visitId), body).then((r) => r.data),

  addendum: (visitId: string, body: { text: string; reason: string }) =>
    api.post<VisitWorkspace>(ENDPOINTS.VISITS.NOTE_ADDENDA(visitId), body).then((r) => r.data),

  noteHistory: (visitId: string) =>
    api.get<VisitHistoryResponse>(ENDPOINTS.VISITS.NOTE_HISTORY(visitId)).then((r) => r.data),

  unlockNote: (visitId: string, reason: string) =>
    api.post<VisitWorkspace>(ENDPOINTS.VISITS.NOTE_UNLOCK(visitId), { reason }).then((r) => r.data),

  revokeUnlock: (visitId: string, reason: string) =>
    api.post<VisitWorkspace>(ENDPOINTS.VISITS.NOTE_REVOKE(visitId), { reason }).then((r) => r.data),

  report: (visitId: string) =>
    api.get<VisitReportDTO | null>(ENDPOINTS.VISITS.REPORT(visitId)).then((r) => r.data),

  saveReport: (visitId: string, body: ReportDraftInput) =>
    api.put<VisitWorkspace>(ENDPOINTS.VISITS.REPORT_DRAFT(visitId), body).then((r) => r.data),

  signReport: (visitId: string, body: SignInput) =>
    api.post<VisitWorkspace>(ENDPOINTS.VISITS.REPORT_SIGN(visitId), body).then((r) => r.data),

  amendReport: (visitId: string, body: ReportAmendInput) =>
    api.post<VisitWorkspace>(ENDPOINTS.VISITS.REPORT_AMEND(visitId), body).then((r) => r.data),

  downloadReport: (visitId: string, revision?: number) => downloadPdf(ENDPOINTS.VISITS.REPORT_PDF(visitId), 'medical-report.pdf', revision),

  invoice: (visitId: string) =>
    api.get<InvoiceDTO | null>(ENDPOINTS.VISITS.INVOICE(visitId)).then((r) => r.data),

  saveInvoice: (visitId: string, body: InvoiceDraftInput) =>
    api.put<VisitWorkspace>(ENDPOINTS.VISITS.INVOICE_DRAFT(visitId), body).then((r) => r.data),

  invoiceFeedback: (visitId: string, message: string) =>
    api.post<InvoiceDTO>(ENDPOINTS.VISITS.INVOICE_FEEDBACK(visitId), { message }).then((r) => r.data),

  resolveFeedback: (visitId: string, feedbackId: string, reason: string) =>
    api.post<InvoiceDTO>(ENDPOINTS.VISITS.INVOICE_FEEDBACK_RESOLVE(visitId, feedbackId), { reason }).then((r) => r.data),

  issueInvoice: (visitId: string, body: SignInput) =>
    api.post<VisitWorkspace>(ENDPOINTS.VISITS.INVOICE_ISSUE(visitId), body).then((r) => r.data),

  correctInvoice: (visitId: string, body: InvoiceCorrectionInput) =>
    api.post<InvoiceDTO>(ENDPOINTS.VISITS.INVOICE_CORRECT(visitId), body).then((r) => r.data),

  voidInvoice: (visitId: string, revision: number, reason: string) =>
    api.post<InvoiceDTO>(ENDPOINTS.VISITS.INVOICE_VOID(visitId), { revision, reason }).then((r) => r.data),

  releaseDocument: (documentId: string, released: boolean, reason: string) =>
    api.post<VisitWorkspace>(ENDPOINTS.VISITS.DOCUMENT_RELEASE(documentId), { released, reason }).then((r) => r.data),

  downloadInvoice: (visitId: string, revision?: number) => downloadPdf(ENDPOINTS.VISITS.INVOICE_PDF(visitId), 'invoice.pdf', revision),

  recordPayment: (invoiceId: string, body: VisitPaymentInput) =>
    api.post<InvoiceDTO>(ENDPOINTS.VISITS.PAYMENT(invoiceId), body).then((r) => r.data),

  reversePayment: (invoiceId: string, body: VisitReversalInput) =>
    api.post<InvoiceDTO>(ENDPOINTS.VISITS.REVERSAL(invoiceId), body).then((r) => r.data),

  preference: () => api.get<NotePreference>(ENDPOINTS.VISITS.NOTE_PREFERENCE).then((r) => r.data),

  setPreference: (templateId: string | null) =>
    api.put<NotePreference>(ENDPOINTS.VISITS.NOTE_PREFERENCE, { templateId }).then((r) => r.data),
};

export type { ClinicalNoteDTO, TemplateDTO, VisitWorkspace };
