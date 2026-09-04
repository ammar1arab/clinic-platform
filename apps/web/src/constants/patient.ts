import type { PatientSortBy, SortOrder } from '@/services/patients.service';
import type { Translations } from '@/i18n';
import { ageLabel } from '@/lib/age';

export const getGenders = (t: Translations) => [
  { value: 'male', label: t.constants.gender['male'] },
  { value: 'female', label: t.constants.gender['female'] },
] as const;

export function genderLabel(value: string | null | undefined, t: Translations): string {
  if (!value) return '';
  if (value === 'male' || value === 'female') return t.constants.gender[value];
  return value;
}

export function patientAgeLabel(dob: string | null | undefined, t: Translations): string {
  return ageLabel(dob, undefined, t);
}

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const getPatientSorts = (t: Translations) => [
  { value: 'createdAt:desc', label: t.constants.patientSorts['createdAt:desc'] },
  { value: 'createdAt:asc', label: t.constants.patientSorts['createdAt:asc'] },
  { value: 'firstNameEn:asc', label: t.constants.patientSorts['firstNameEn:asc'] },
  { value: 'firstNameEn:desc', label: t.constants.patientSorts['firstNameEn:desc'] },
  { value: 'lastNameEn:asc', label: t.constants.patientSorts['lastNameEn:asc'] },
  { value: 'appointments:desc', label: t.constants.patientSorts['appointments:desc'] },
  { value: 'dob:desc', label: t.constants.patientSorts['dob:desc'] },
  { value: 'dob:asc', label: t.constants.patientSorts['dob:asc'] },
] as const;

export const DEFAULT_PATIENT_SORT = 'createdAt:desc';

export function parsePatientSort(value: string): {
  sortBy: PatientSortBy;
  sortOrder: SortOrder;
} {
  const [sortBy, sortOrder] = value.split(':') as [PatientSortBy, SortOrder];
  return { sortBy, sortOrder };
}
