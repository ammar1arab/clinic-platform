import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reportsService, ReportFormat } from '@/services/reports.service';

export function useDownloadPatientReport(clinicId: string) {
  return useMutation({
    mutationFn: ({
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
  return useMutation({
    mutationFn: (params: {
      format?: ReportFormat;
      patientId?: string;
      toDoctorId?: string;
      from?: string;
      to?: string;
    }) => reportsService.downloadReferrals({ clinicId, ...params }),
    onSuccess: (res) => {
      toast.success(`Downloaded ${res.filename}`);
    },
  });
}

export function useDownloadFinanceReport(clinicId: string) {
  return useMutation({
    mutationFn: (params: {
      format?: ReportFormat;
      from?: string;
      to?: string;
    }) => reportsService.downloadFinance({ clinicId, ...params }),
    onSuccess: (res) => {
      toast.success(`Downloaded ${res.filename}`);
    },
  });
}
