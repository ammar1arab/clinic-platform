import type { Patient } from '@/services/patients.service';
import { formatPhoneDisplay } from '@/lib/contact';
import { exportTable, type TableExportFormat } from '@/lib/export-table';

export type PatientExportFormat = TableExportFormat;

const COLUMNS = [
  { header: 'First Name', value: (p: Patient) => p.firstNameEn ?? '' },
  { header: 'Last Name', value: (p: Patient) => p.lastNameEn ?? '' },
  { header: 'Phone', value: (p: Patient) => formatPhoneDisplay(p.phone) || p.phone || '' },
  { header: 'Email', value: (p: Patient) => p.email ?? '' },
  { header: 'National ID', value: (p: Patient) => p.nationalId ?? '' },
  { header: 'Gender', value: (p: Patient) => p.gender ?? '' },
  { header: 'Blood Type', value: (p: Patient) => p.bloodType ?? '' },
  { header: 'DOB', value: (p: Patient) => (p.dob ? p.dob.slice(0, 10) : '') },
  { header: 'Primary Doctor', value: (p: Patient) => p.primaryDoctorName ?? '' },
  { header: 'Total Sessions', value: (p: Patient) => p.totalSessions ?? 0 },
  { header: 'First Visit', value: (p: Patient) => (p.firstVisit ? p.firstVisit.slice(0, 10) : '') },
  { header: 'Last Visit', value: (p: Patient) => (p.lastVisit ? p.lastVisit.slice(0, 10) : '') },
  { header: 'Status', value: (p: Patient) => (p.isActive ? 'Active' : 'Inactive') },
];

export function exportPatients(
  patients: Patient[],
  format: PatientExportFormat,
  baseName = `patients-${new Date().toISOString().slice(0, 10)}`,
) {
  exportTable({
    rows: patients,
    columns: COLUMNS,
    format,
    title: 'Patients directory',
    sheetName: 'Patients',
    filename: baseName,
  });
}
