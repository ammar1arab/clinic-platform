import { reportsService, ReportFormat } from '@/services/reports.service';
import { useApiMutation, type TResponseError } from '@/core/api/query';

export interface ReportDownloadResult {
  filename: string;
}

type ReferralsDownloadVars = {
  format?: ReportFormat;
  patientId?: string;
  toDoctorId?: string;
  from?: string;
  to?: string;
};

type FinanceDownloadVars = {
  format?: ReportFormat;
  from?: string;
  to?: string;
};

const downloaded = (res: ReportDownloadResult) => `Downloaded ${res.filename}`;

export function useDownloadPatientReport(clinicId: string) {
  return useApiMutation<
    ReportDownloadResult,
    TResponseError,
    { patientId: string; format?: ReportFormat }
  >({
    request: ({ patientId, format = 'pdf' }) =>
      reportsService.downloadPatientMedical(patientId, clinicId, format),
    successMessage: downloaded,
  });
}

export function useDownloadReferralsReport(clinicId: string) {
  return useApiMutation<ReportDownloadResult, TResponseError, ReferralsDownloadVars>({
    request: (params) => reportsService.downloadReferrals({ clinicId, ...params }),
    successMessage: downloaded,
  });
}

export function useDownloadFinanceReport(clinicId: string) {
  return useApiMutation<ReportDownloadResult, TResponseError, FinanceDownloadVars>({
    request: (params) => reportsService.downloadFinance({ clinicId, ...params }),
    successMessage: downloaded,
  });
}