import { getTranslations, getLanguage, type Translations } from '@/i18n';
import { genderLabel } from '@/constants/patient';
import type { Patient } from '@/services/patients.service';
import { formatPhoneDisplay } from '@/lib/contact';
import { exportTable, type TableExportFormat } from '@/lib/export-table';

export type PatientExportFormat = TableExportFormat;

const getColumns = (t: Translations) => [
  { header: t.exports.firstName, value: (p: Patient) => p.firstNameEn ?? '' },
  { header: t.exports.lastName, value: (p: Patient) => p.lastNameEn ?? '' },
  {
    header: t.exports.phone,
    value: (p: Patient) => formatPhoneDisplay(p.phone) || p.phone || '',
  },
  { header: t.exports.email, value: (p: Patient) => p.email ?? '' },
  { header: t.exports.nationalId, value: (p: Patient) => p.nationalId ?? '' },
  { header: t.exports.gender, value: (p: Patient) => genderLabel(p.gender, t) },
  { header: t.exports.bloodType, value: (p: Patient) => p.bloodType ?? '' },
  {
    header: t.exports.dob,
    value: (p: Patient) => (p.dob ? p.dob.slice(0, 10) : ''),
  },
  {
    header: t.exports.primaryDoctor,
    value: (p: Patient) => p.primaryDoctorName ?? '',
  },
  {
    header: t.exports.totalSessions,
    value: (p: Patient) => p.totalSessions ?? 0,
  },
  {
    header: t.exports.firstVisit,
    value: (p: Patient) => (p.firstVisit ? p.firstVisit.slice(0, 10) : ''),
  },
  {
    header: t.exports.lastVisit,
    value: (p: Patient) => (p.lastVisit ? p.lastVisit.slice(0, 10) : ''),
  },
  {
    header: t.exports.status,
    value: (p: Patient) => (p.isActive ? t.common.active : t.common.inactive),
  },
];

export function exportPatients(
  patients: Patient[],
  format: PatientExportFormat,
  baseName = `patients-${new Date().toISOString().slice(0, 10)}`,
) {
  const lang = getLanguage();
  const t = getTranslations(lang);
  exportTable({
    t,
    lang,
    rows: patients,
    columns: getColumns(t),
    format,
    title: t.exports.patientsDirectory,
    sheetName: t.exports.patients,
    filename: baseName,
  });
}
