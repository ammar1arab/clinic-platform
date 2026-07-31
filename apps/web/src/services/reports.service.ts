import { api } from '@/lib/api';
import { getToken } from '@/lib/auth-token';
import { env } from '@/lib/env';

import type { ReportFormat } from '@clinic/types';
export type { ReportFormat } from '@clinic/types';

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
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
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const type = (res.headers['content-type'] as string) || 'application/octet-stream';
  const blob = new Blob([res.data], { type });
  const filename = filenameFromDisposition(
    res.headers['content-disposition'] as string | undefined,
    fallbackName,
  );
  triggerBrowserDownload(blob, filename);
  return { filename };
}

function extFor(format: ReportFormat) {
  if (format === 'xlsx') return 'xls';
  return format;
}

export const reportsService = {

  downloadPatientMedical: (
    patientId: string,
    clinicId: string,
    format: ReportFormat = 'pdf',
  ) =>
    downloadReport(
      `/reports/patients/${patientId}?clinicId=${encodeURIComponent(clinicId)}&format=${format}`,
      `patient-report.${extFor(format)}`,
    ),


  downloadReferrals: (params: {
    clinicId: string;
    format?: ReportFormat;
    patientId?: string;
    toDoctorId?: string;
    from?: string;
    to?: string;
  }) => {
    const format = params.format ?? 'pdf';
    const q = new URLSearchParams();
    q.set('clinicId', params.clinicId);
    q.set('format', format);
    if (params.patientId) q.set('patientId', params.patientId);
    if (params.toDoctorId) q.set('toDoctorId', params.toDoctorId);
    if (params.from) q.set('from', params.from);
    if (params.to) q.set('to', params.to);
    return downloadReport(`/reports/referrals?${q.toString()}`, `referrals.${extFor(format)}`);
  },


  downloadFinance: (params: {
    clinicId: string;
    format?: ReportFormat;
    from?: string;
    to?: string;
  }) => {
    const format = params.format ?? 'pdf';
    const q = new URLSearchParams();
    q.set('clinicId', params.clinicId);
    q.set('format', format);
    if (params.from) q.set('from', params.from);
    if (params.to) q.set('to', params.to);
    return downloadReport(`/reports/finance?${q.toString()}`, `finance.${extFor(format)}`);
  },


  apiBase: () => env.NEXT_PUBLIC_API_URL,
};
