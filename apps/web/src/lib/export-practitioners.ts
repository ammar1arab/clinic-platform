import { getTranslations, getLanguage, type Translations } from '@/i18n';
import { genderLabel } from '@/constants/patient';
import type { Practitioner } from '@/services/practitioners.service';
import { formatPhoneDisplay } from '@/lib/contact';
import { exportTable, type TableExportFormat } from '@/lib/export-table';
import {
  languageLabels,
  getPractitionerEmploymentLabels,
} from '@/constants/practitioner';

export type PractitionerExportFormat = TableExportFormat;

const getColumns = (t: Translations) => [
  { header: t.exports.name, value: (p: Practitioner) => (p.title ? `${p.title} ${p.name}` : p.name) },
  { header: t.exports.nameAr, value: (p: Practitioner) => p.nameAr ?? '' },
  { header: t.exports.email, value: (p: Practitioner) => p.email ?? '' },
  { header: t.exports.phone, value: (p: Practitioner) => formatPhoneDisplay(p.phone) || p.phone || '' },
  { header: t.exports.department, value: (p: Practitioner) => p.departmentName ?? '' },
  { header: t.exports.specialty, value: (p: Practitioner) => p.specialty ?? '' },
  { header: t.exports.employment, value: (p: Practitioner) => (p.employmentType ? PRACTITIONER_EMPLOYMENT_LABEL[p.employmentType] ?? p.employmentType : '') },
  { header: t.exports.languages, value: (p: Practitioner) => languageLabels(p.languages, t) },
  { header: t.exports.license, value: (p: Practitioner) => p.licenseNumber ?? '' },
  { header: t.exports.licenseExpiry, value: (p: Practitioner) => (p.licenseExpiry ? p.licenseExpiry.slice(0, 10) : '') },
  { header: t.exports.experience, value: (p: Practitioner) => p.experienceYears ?? '' },
  { header: t.exports.room, value: (p: Practitioner) => p.defaultRoomName ?? '' },
  { header: t.exports.gender, value: (p: Practitioner) => genderLabel(p.gender, t) },
  { header: t.exports.nationality, value: (p: Practitioner) => p.nationality ?? '' },
  { header: t.exports.status, value: (p: Practitioner) => (p.isActive ? t.common.active : t.common.inactive) },
];

export function exportPractitioners(
  practitioners: Practitioner[],
  format: PractitionerExportFormat,
  baseName = `practitioners-${new Date().toISOString().slice(0, 10)}`,
) {
  const lang = getLanguage();
  const t = getTranslations(lang);
  exportTable({
    t,
    lang,
    rows: practitioners,
    columns: getColumns(t),
    format,
    title: t.exports.practitionersDirectory,
    sheetName: t.exports.practitioners,
    filename: baseName,
  });
}
