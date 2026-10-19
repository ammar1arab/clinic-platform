import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type {
  InvoiceCorrectionInput,
  InvoiceDraftInput,
  NoteDraftInput,
  PresenceSource,
  ReportAmendInput,
  ReportDraftInput,
  VisitListQuery,
  VisitListResponse,
  VisitPaymentInput,
  VisitReversalInput,
  VisitWorkspace,
} from '@clinic/types';
import { QUERY_KEYS } from '@/constants/query-keys';
import { visitsService } from '@/services/visits.service';
import { useLanguage } from '@/providers';
import { BILLING_OPTIONS, INVALIDATE, LIVE_LIST_OPTIONS, useApiMutation, useFetchData, type TResponseError } from '../query';

export function visitErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data;
  if (data && typeof data === 'object' && 'code' in data && typeof data.code === 'string') return data.code;
  return undefined;
}

function useWorkspaceMutation<TVariables>(
  request: (variables: TVariables) => Promise<VisitWorkspace>,
  appointmentId: string,
  successMessage?: string,
) {
  const queryClient = useQueryClient();
  return useApiMutation<VisitWorkspace, TResponseError, TVariables>({
    request,
    invalidateQueries: [...INVALIDATE.visitWrite],
    successMessage,
    onSuccess: (workspace) => {
      queryClient.setQueryData(QUERY_KEYS.visits.workspace(appointmentId), workspace);
    },
  });
}

export function useVisits(query: VisitListQuery, enabled = true) {
  return useFetchData<VisitListResponse>({
    queryKey: QUERY_KEYS.visits.list(query),
    request: () => visitsService.list(query),
    options: { ...LIVE_LIST_OPTIONS, enabled },
  });
}

export function useVisitWorkspace(appointmentId: string) {
  return useFetchData<VisitWorkspace>({
    queryKey: QUERY_KEYS.visits.workspace(appointmentId),
    request: () => visitsService.workspace(appointmentId),
    options: { ...BILLING_OPTIONS, enabled: !!appointmentId },
  });
}

export function useCheckIn(appointmentId: string) {
  const { t } = useLanguage();
  return useWorkspaceMutation(
    (source: PresenceSource) => visitsService.checkIn(appointmentId, source),
    appointmentId,
    t.visits.presenceSaved,
  );
}

export function useMarkWaiting(appointmentId: string) {
  const { t } = useLanguage();
  return useWorkspaceMutation(
    () => visitsService.markWaiting(appointmentId),
    appointmentId,
    t.visits.presenceSaved,
  );
}

export function useStartVisit(appointmentId: string) {
  const { t } = useLanguage();
  return useWorkspaceMutation(
    (expectedAppointmentRevision?: number) => visitsService.start(appointmentId, expectedAppointmentRevision),
    appointmentId,
    t.visits.started,
  );
}

export function useFinishVisit(appointmentId: string) {
  const { t } = useLanguage();
  return useWorkspaceMutation(
    (input: { visitId: string; expectedRevision: number }) => visitsService.finish(input.visitId, input.expectedRevision),
    appointmentId,
    t.visits.finished,
  );
}

export function useSaveNote(appointmentId: string) {
  return useWorkspaceMutation(
    (input: { visitId: string; body: NoteDraftInput }) => visitsService.saveNote(input.visitId, input.body),
    appointmentId,
  );
}

export function useSignNote(appointmentId: string) {
  const { t } = useLanguage();
  return useWorkspaceMutation(
    (input: { visitId: string; revision: number }) => visitsService.signNote(input.visitId, { revision: input.revision }),
    appointmentId,
    t.visits.noteSigned,
  );
}

export function useNoteAddendum(appointmentId: string) {
  const { t } = useLanguage();
  return useWorkspaceMutation(
    (input: { visitId: string; text: string; reason: string }) => visitsService.addendum(input.visitId, { text: input.text, reason: input.reason }),
    appointmentId,
    t.visits.addendumSaved,
  );
}

export function useUnlockNote(appointmentId: string) {
  const { t } = useLanguage();
  return useWorkspaceMutation(
    (input: { visitId: string; reason: string }) => visitsService.unlockNote(input.visitId, input.reason),
    appointmentId,
    t.visits.unlocked,
  );
}

export function useRevokeUnlock(appointmentId: string) {
  const { t } = useLanguage();
  return useWorkspaceMutation(
    (input: { visitId: string; reason: string }) => visitsService.revokeUnlock(input.visitId, input.reason),
    appointmentId,
    t.visits.unlockRevoked,
  );
}

export function useSaveReport(appointmentId: string) {
  return useWorkspaceMutation(
    (input: { visitId: string; body: ReportDraftInput }) => visitsService.saveReport(input.visitId, input.body),
    appointmentId,
  );
}

export function useSignReport(appointmentId: string) {
  const { t } = useLanguage();
  return useWorkspaceMutation(
    (input: { visitId: string; revision: number }) => visitsService.signReport(input.visitId, { revision: input.revision }),
    appointmentId,
    t.visits.reportSigned,
  );
}

export function useAmendReport(appointmentId: string) {
  const { t } = useLanguage();
  return useWorkspaceMutation(
    (input: { visitId: string; body: ReportAmendInput }) => visitsService.amendReport(input.visitId, input.body),
    appointmentId,
    t.visits.reportAmended,
  );
}

export function useSaveInvoice(appointmentId: string) {
  return useWorkspaceMutation(
    (input: { visitId: string; body: InvoiceDraftInput }) => visitsService.saveInvoice(input.visitId, input.body),
    appointmentId,
  );
}

export function useIssueInvoice(appointmentId: string) {
  const { t } = useLanguage();
  return useWorkspaceMutation(
    (input: { visitId: string; revision: number }) => visitsService.issueInvoice(input.visitId, { revision: input.revision }),
    appointmentId,
    t.visits.invoiceIssued,
  );
}

export function useInvoiceFeedback(appointmentId: string) {
  const { t } = useLanguage();
  return useApiMutation({
    request: (input: { visitId: string; message: string }) => visitsService.invoiceFeedback(input.visitId, input.message),
    invalidateQueries: [QUERY_KEYS.visits.workspace(appointmentId), ...INVALIDATE.visitWrite],
    successMessage: t.visits.feedbackSent,
  });
}

export function useRecordPayment(appointmentId: string) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  return useApiMutation({
    request: (input: { invoiceId: string; body: VisitPaymentInput }) => visitsService.recordPayment(input.invoiceId, input.body),
    invalidateQueries: [QUERY_KEYS.visits.workspace(appointmentId), ...INVALIDATE.visitWrite],
    successMessage: t.visits.paymentRecorded,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visits.workspace(appointmentId) });
    },
  });
}

export function useReversePayment(appointmentId: string) {
  const { t } = useLanguage();
  return useApiMutation({
    request: (input: { invoiceId: string; body: VisitReversalInput }) => visitsService.reversePayment(input.invoiceId, input.body),
    invalidateQueries: [QUERY_KEYS.visits.workspace(appointmentId), ...INVALIDATE.visitWrite],
    successMessage: t.visits.paymentReversed,
  });
}

export function useNoteHistory(visitId: string, enabled: boolean) {
  return useFetchData({
    queryKey: QUERY_KEYS.visits.history(visitId),
    request: () => visitsService.noteHistory(visitId),
    options: { enabled: enabled && !!visitId },
  });
}

export function useNotePreference(enabled: boolean) {
  return useFetchData({
    queryKey: QUERY_KEYS.notePreference,
    request: () => visitsService.preference(),
    options: { enabled },
  });
}

export function useSetNotePreference() {
  const { t } = useLanguage();
  return useApiMutation({
    request: (templateId: string | null) => visitsService.setPreference(templateId),
    invalidateQueries: [QUERY_KEYS.notePreference],
    successMessage: t.visits.preferenceSaved,
  });
}

export function useCorrectInvoice(appointmentId: string) {
  const { t } = useLanguage();
  return useApiMutation({
    request: (input: { visitId: string; body: InvoiceCorrectionInput }) => visitsService.correctInvoice(input.visitId, input.body),
    invalidateQueries: [QUERY_KEYS.visits.workspace(appointmentId), ...INVALIDATE.visitWrite],
    successMessage: t.visits.invoiceCorrected,
  });
}

export function useVoidInvoice(appointmentId: string) {
  const { t } = useLanguage();
  return useApiMutation({
    request: (input: { visitId: string; revision: number; reason: string }) => visitsService.voidInvoice(input.visitId, input.revision, input.reason),
    invalidateQueries: [QUERY_KEYS.visits.workspace(appointmentId), ...INVALIDATE.visitWrite],
    successMessage: t.visits.invoiceVoided,
  });
}

export function useResolveInvoiceFeedback(appointmentId: string) {
  const { t } = useLanguage();
  return useApiMutation({
    request: (input: { visitId: string; feedbackId: string; reason: string }) => visitsService.resolveFeedback(input.visitId, input.feedbackId, input.reason),
    invalidateQueries: [QUERY_KEYS.visits.workspace(appointmentId), ...INVALIDATE.visitWrite],
    successMessage: t.visits.feedbackResolved,
  });
}

export function useReleaseDocument(appointmentId: string) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  return useApiMutation<VisitWorkspace, TResponseError, { documentId: string; released: boolean; reason: string }>({
    request: (input) => visitsService.releaseDocument(input.documentId, input.released, input.reason),
    invalidateQueries: [...INVALIDATE.visitWrite],
    successMessage: t.visits.documentReleased,
    onSuccess: (workspace) => {
      queryClient.setQueryData(QUERY_KEYS.visits.workspace(appointmentId), workspace);
    },
  });
}

export function useDownloadVisitPdf() {
  return useApiMutation({
    request: (input: { kind: 'report' | 'invoice'; visitId: string; revision?: number }) =>
      input.kind === 'report' ? visitsService.downloadReport(input.visitId, input.revision) : visitsService.downloadInvoice(input.visitId, input.revision),
  });
}
