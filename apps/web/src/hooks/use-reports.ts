import { toast } from 'sonner';
import { reportsService, ReportFormat } from '@/services/reports.service';
import { useApiMutation } from './use-api-mutation';

export interface ReportDownloadResult {
  filename: string;
}

export function useDownloadPatientReport(clinicId: string) {
  return useApiMutation<ReportDownloadResult, unknown, { patientId: string; format?: ReportFormat }>({
    request: ({
      patientId,
      format = 'pdf',
    }: {
      patientId: string;
      format?: ReportFormat;
    }) => reportsService.downloadPatientMedical(patientId, clinicId, format),
    onSuccess: (res) => {
      toast.success(`Downloaded ${res.filename}`);
    },
  });
}

export function useDownloadReferralsReport(clinicId: string) {
  return useApiMutation<
    ReportDownloadResult,
    unknown,
    {
      format?: ReportFormat;
      patientId?: string;
      toDoctorId?: string;
      from?: string;
      to?: string;
    }
  >({
    request: (params) => reportsService.downloadReferrals({ clinicId, ...params }),
    onSuccess: (res) => {
      toast.success(`Downloaded ${res.filename}`);
    },
  });
}

export function useDownloadFinanceReport(clinicId: string) {
  return useApiMutation<
    ReportDownloadResult,
    unknown,
    {
      format?: ReportFormat;
      from?: string;
      to?: string;
    }
  >({
    request: (params) => reportsService.downloadFinance({ clinicId, ...params }),
    onSuccess: (res) => {
      toast.success(`Downloaded ${res.filename}`);
    },
  });
}
