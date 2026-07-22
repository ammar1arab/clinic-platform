import type { PatientSortBy, SortOrder } from '@/services/patients.service';

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

/**
 * Sort presets shown in the UI. Each maps to a `sortBy` + `sortOrder` pair
 * understood by the Patients API. The `value` is a `sortBy:sortOrder` string
 * so it can back a single <Select>.
 */
export const PATIENT_SORTS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'firstNameEn:asc', label: 'First name (A–Z)' },
  { value: 'firstNameEn:desc', label: 'First name (Z–A)' },
  { value: 'lastNameEn:asc', label: 'Last name (A–Z)' },
  { value: 'appointments:desc', label: 'Most sessions' },
  { value: 'dob:desc', label: 'Youngest' },
  { value: 'dob:asc', label: 'Oldest (age)' },
] as const;

export const DEFAULT_PATIENT_SORT = 'createdAt:desc';

export function parsePatientSort(value: string): {
  sortBy: PatientSortBy;
  sortOrder: SortOrder;
} {
  const [sortBy, sortOrder] = value.split(':') as [PatientSortBy, SortOrder];
  return { sortBy, sortOrder };
}
