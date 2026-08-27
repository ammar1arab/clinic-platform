import type { Practitioner } from '@/services/practitioners.service';
import { formatPhoneDisplay } from '@/lib/contact';
import { exportTable, type TableExportFormat } from '@/lib/export-table';
import {
  languageLabels,
  PRACTITIONER_EMPLOYMENT_LABEL,
} from '@/constants/practitioner';

export type PractitionerExportFormat = TableExportFormat;

const COLUMNS = [
  { header: 'Name', value: (p: Practitioner) => (p.title ? `${p.title} ${p.name}` : p.name) },
  { header: 'Name (AR)', value: (p: Practitioner) => p.nameAr ?? '' },
  { header: 'Email', value: (p: Practitioner) => p.email ?? '' },
  { header: 'Phone', value: (p: Practitioner) => formatPhoneDisplay(p.phone) || p.phone || '' },
  { header: 'Department', value: (p: Practitioner) => p.departmentName ?? '' },
  { header: 'Specialty', value: (p: Practitioner) => p.specialty ?? '' },
  { header: 'Employment', value: (p: Practitioner) => (p.employmentType ? PRACTITIONER_EMPLOYMENT_LABEL[p.employmentType] ?? p.employmentType : '') },
  { header: 'Languages', value: (p: Practitioner) => languageLabels(p.languages) },
  { header: 'License', value: (p: Practitioner) => p.licenseNumber ?? '' },
  { header: 'License expiry', value: (p: Practitioner) => (p.licenseExpiry ? p.licenseExpiry.slice(0, 10) : '') },
  { header: 'Experience', value: (p: Practitioner) => p.experienceYears ?? '' },
  { header: 'Room', value: (p: Practitioner) => p.defaultRoomName ?? '' },
  { header: 'Gender', value: (p: Practitioner) => p.gender ?? '' },
  { header: 'Nationality', value: (p: Practitioner) => p.nationality ?? '' },
  { header: 'Status', value: (p: Practitioner) => (p.isActive ? 'Active' : 'Inactive') },
];

export function exportPractitioners(
  practitioners: Practitioner[],
  format: PractitionerExportFormat,
  baseName = `practitioners-${new Date().toISOString().slice(0, 10)}`,
) {
  exportTable({
    rows: practitioners,
    columns: COLUMNS,
    format,
    title: 'Practitioners directory',
    sheetName: 'Practitioners',
    filename: baseName,
  });
}
