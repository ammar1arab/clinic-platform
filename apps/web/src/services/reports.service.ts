import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import { getToken } from "@/lib/auth-token";
import { env } from "@/lib/env";

import type { ReportFormat } from "@clinic/types";
export type { ReportFormat } from "@clinic/types";

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function filenameFromDisposition(header: string | undefined, fallback: string) {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8''|")?([^\";]+)"?/i.exec(header);
  if (!match?.[1]) return fallback;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}

async function downloadReport(path: string, fallbackName: string) {
  const token = getToken();
  const res = await api.get(path, {
    responseType: "blob",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const type =
    (res.headers["content-type"] as string) || "application/octet-stream";
  const blob = new Blob([res.data], { type });
  const filename = filenameFromDisposition(
    res.headers["content-disposition"] as string | undefined,
    fallbackName,
  );
  triggerBrowserDownload(blob, filename);
  return { filename };
}

function extFor(format: ReportFormat) {
  if (format === "xlsx") return "xls";
  return format;
}

function withQuery(
  path: string,
  params: Record<string, string | undefined>,
) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) q.set(key, value);
  });
  return `${path}?${q.toString()}`;
}

export type DirectoryDownloadParams = {
  clinicId: string;
  format?: ReportFormat;
  search?: string;
  status?: string;
  departmentId?: string;
  employmentType?: string;
  gender?: string;
  language?: string;
  specialty?: string;
  roomId?: string;
  nationality?: string;
  license?: string;
  experience?: string;
  sort?: string;
  bloodType?: string;
  primaryDoctorId?: string;
  visitFrom?: string;
  visitTo?: string;
  dobFrom?: string;
  dobTo?: string;
  sortBy?: string;
  sortOrder?: string;
};

function directoryQuery(params: DirectoryDownloadParams) {
  const { clinicId, format = "pdf", ...rest } = params;
  return {
    clinicId,
    format,
    ...Object.fromEntries(
      Object.entries(rest).filter(([, value]) => Boolean(value)),
    ),
  };
}

export const reportsService = {
  downloadPatientMedical: (
    patientId: string,
    clinicId: string,
    format: ReportFormat = "pdf",
  ) =>
    downloadReport(
      withQuery(ENDPOINTS.REPORTS.PATIENT_MEDICAL(patientId), {
        clinicId,
        format,
      }),
      `patient-report.${extFor(format)}`,
    ),

  downloadPatientsDirectory: (params: DirectoryDownloadParams) => {
    const format = params.format ?? "pdf";
    return downloadReport(
      withQuery(ENDPOINTS.REPORTS.PATIENTS_DIRECTORY, directoryQuery(params)),
      `patients-directory.${extFor(format)}`,
    );
  },

  downloadPractitionersDirectory: (params: DirectoryDownloadParams) => {
    const format = params.format ?? "pdf";
    return downloadReport(
      withQuery(
        ENDPOINTS.REPORTS.PRACTITIONERS_DIRECTORY,
        directoryQuery(params),
      ),
      `practitioners-directory.${extFor(format)}`,
    );
  },

  downloadPractitionerProfile: (
    practitionerId: string,
    clinicId: string,
    format: ReportFormat = "pdf",
  ) =>
    downloadReport(
      withQuery(ENDPOINTS.REPORTS.PRACTITIONER_PROFILE(practitionerId), {
        clinicId,
        format,
      }),
      `practitioner-profile.${extFor(format)}`,
    ),

  downloadPractitionerHours: (
    practitionerId: string,
    clinicId: string,
    format: ReportFormat = "pdf",
  ) =>
    downloadReport(
      withQuery(ENDPOINTS.REPORTS.PRACTITIONER_HOURS(practitionerId), {
        clinicId,
        format,
      }),
      `practitioner-hours.${extFor(format)}`,
    ),

  downloadPractitionerExceptions: (
    practitionerId: string,
    clinicId: string,
    format: ReportFormat = "pdf",
  ) =>
    downloadReport(
      withQuery(ENDPOINTS.REPORTS.PRACTITIONER_EXCEPTIONS(practitionerId), {
        clinicId,
        format,
      }),
      `practitioner-exceptions.${extFor(format)}`,
    ),

  downloadPractitionerAppointments: (params: {
    practitionerId: string;
    clinicId: string;
    format?: ReportFormat;
    from?: string;
    to?: string;
  }) => {
    const format = params.format ?? "pdf";
    return downloadReport(
      withQuery(
        ENDPOINTS.REPORTS.PRACTITIONER_APPOINTMENTS(params.practitionerId),
        {
          clinicId: params.clinicId,
          format,
          from: params.from,
          to: params.to,
        },
      ),
      `practitioner-appointments.${extFor(format)}`,
    );
  },

  downloadClinicAppointments: (params: {
    clinicId: string;
    format?: ReportFormat;
    from?: string;
    to?: string;
    status?: string;
  }) => {
    const format = params.format ?? "pdf";
    return downloadReport(
      withQuery(ENDPOINTS.REPORTS.APPOINTMENTS, {
        clinicId: params.clinicId,
        format,
        from: params.from,
        to: params.to,
        status: params.status,
      }),
      `clinic-appointments.${extFor(format)}`,
    );
  },

  downloadReferrals: (params: {
    clinicId: string;
    format?: ReportFormat;
    patientId?: string;
    toDoctorId?: string;
    from?: string;
    to?: string;
  }) => {
    const format = params.format ?? "pdf";
    return downloadReport(
      withQuery(ENDPOINTS.REPORTS.REFERRALS, {
        clinicId: params.clinicId,
        format,
        patientId: params.patientId,
        toDoctorId: params.toDoctorId,
        from: params.from,
        to: params.to,
      }),
      `referrals.${extFor(format)}`,
    );
  },

  downloadFinance: (params: {
    clinicId: string;
    format?: ReportFormat;
    from?: string;
    to?: string;
  }) => {
    const format = params.format ?? "pdf";
    return downloadReport(
      withQuery(ENDPOINTS.REPORTS.FINANCE, {
        clinicId: params.clinicId,
        format,
        from: params.from,
        to: params.to,
      }),
      `finance.${extFor(format)}`,
    );
  },

  apiBase: () => env.NEXT_PUBLIC_API_URL,
};
