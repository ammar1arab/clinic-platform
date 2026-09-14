import {
  reportsService,
  type DirectoryDownloadParams,
  type ReportFormat,
} from '@/services/reports.service';
import { type TResponseError, useApiMutation } from '../query';

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

export function useDownloadPatientsDirectory(clinicId: string) {
  return useApiMutation<
    ReportDownloadResult,
    TResponseError,
    Omit<DirectoryDownloadParams, 'clinicId'>
  >({
    request: (params) =>
      reportsService.downloadPatientsDirectory({ clinicId, ...params }),
    successMessage: downloaded,
  });
}

export function useDownloadPractitionersDirectory(clinicId: string) {
  return useApiMutation<
    ReportDownloadResult,
    TResponseError,
    Omit<DirectoryDownloadParams, 'clinicId'>
  >({
    request: (params) =>
      reportsService.downloadPractitionersDirectory({ clinicId, ...params }),
    successMessage: downloaded,
  });
}

export function useDownloadPractitionerProfile(clinicId: string) {
  return useApiMutation<
    ReportDownloadResult,
    TResponseError,
    { practitionerId: string; format?: ReportFormat }
  >({
    request: ({ practitionerId, format = 'pdf' }) =>
      reportsService.downloadPractitionerProfile(practitionerId, clinicId, format),
    successMessage: downloaded,
  });
}

export function useDownloadPractitionerHours(clinicId: string) {
  return useApiMutation<
    ReportDownloadResult,
    TResponseError,
    { practitionerId: string; format?: ReportFormat }
  >({
    request: ({ practitionerId, format = 'pdf' }) =>
      reportsService.downloadPractitionerHours(practitionerId, clinicId, format),
    successMessage: downloaded,
  });
}

export function useDownloadPractitionerExceptions(clinicId: string) {
  return useApiMutation<
    ReportDownloadResult,
    TResponseError,
    { practitionerId: string; format?: ReportFormat }
  >({
    request: ({ practitionerId, format = 'pdf' }) =>
      reportsService.downloadPractitionerExceptions(
        practitionerId,
        clinicId,
        format,
      ),
    successMessage: downloaded,
  });
}

export function useDownloadPractitionerAppointments(clinicId: string) {
  return useApiMutation<
    ReportDownloadResult,
    TResponseError,
    { practitionerId: string; format?: ReportFormat; from?: string; to?: string }
  >({
    request: (params) =>
      reportsService.downloadPractitionerAppointments({ clinicId, ...params }),
    successMessage: downloaded,
  });
}

export function useDownloadClinicAppointments(clinicId: string) {
  return useApiMutation<
    ReportDownloadResult,
    TResponseError,
    { format?: ReportFormat; from?: string; to?: string; status?: string }
  >({
    request: (params) =>
      reportsService.downloadClinicAppointments({ clinicId, ...params }),
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
