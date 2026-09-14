import type { Translations } from '@/i18n';

export const getPractitionerEmploymentLabels = (
  t: Translations,
): Record<string, string> => t.constants.employment;

export const PRACTITIONER_EMPLOYMENT_VARIANT: Record<
  string,
  'secondary' | 'warning' | 'info'
> = {
  salaried: 'secondary',
  commission: 'warning',
  mixed: 'info',
};

export const getPractitionerLanguages = (t: Translations) =>
  [
    { value: 'ar', label: t.constants.languages['ar'] },
    { value: 'en', label: t.constants.languages['en'] },
    { value: 'fr', label: t.constants.languages['fr'] },
    { value: 'de', label: t.constants.languages['de'] },
    { value: 'es', label: t.constants.languages['es'] },
    { value: 'tr', label: t.constants.languages['tr'] },
    { value: 'ru', label: t.constants.languages['ru'] },
    { value: 'hi', label: t.constants.languages['hi'] },
    { value: 'ur', label: t.constants.languages['ur'] },
  ] as const;

export function languageLabelList(
  codes: string[] | null | undefined,
  t: Translations,
): string[] {
  if (!codes?.length) return [];
  const map = Object.fromEntries(
    getPractitionerLanguages(t).map((l) => [l.value, l.label]),
  );
  return codes.map((code) => map[code] ?? code);
}

export function languageLabels(
  codes: string[] | null | undefined,
  t: Translations,
): string {
  return languageLabelList(codes, t).join(', ');
}

export const LANGUAGE_BADGE_VARIANT = [
  'info',
  'success',
  'warning',
  'secondary',
] as const;

export const WEEKDAY_OPTIONS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const getPractitionerSorts = (t: Translations) =>
  [
    { value: 'name:asc', label: t.constants.practitionerSorts['name:asc'] },
    { value: 'name:desc', label: t.constants.practitionerSorts['name:desc'] },
    {
      value: 'createdAt:desc',
      label: t.constants.practitionerSorts['createdAt:desc'],
    },
    {
      value: 'createdAt:asc',
      label: t.constants.practitionerSorts['createdAt:asc'],
    },
    {
      value: 'department:asc',
      label: t.constants.practitionerSorts['department:asc'],
    },
    {
      value: 'specialty:asc',
      label: t.constants.practitionerSorts['specialty:asc'],
    },
    {
      value: 'experience:desc',
      label: t.constants.practitionerSorts['experience:desc'],
    },
    {
      value: 'experience:asc',
      label: t.constants.practitionerSorts['experience:asc'],
    },
    {
      value: 'licenseExpiry:asc',
      label: t.constants.practitionerSorts['licenseExpiry:asc'],
    },
  ] as const;

export const DEFAULT_PRACTITIONER_SORT = 'name:asc';

export const getPractitionerLicenseFilters = (t: Translations) =>
  [
    { value: 'all', label: t.constants.licenseFilters['all'] },
    { value: 'valid', label: t.constants.licenseFilters['valid'] },
    { value: 'expiring', label: t.constants.licenseFilters['expiring'] },
    { value: 'expired', label: t.constants.licenseFilters['expired'] },
    { value: 'missing', label: t.constants.licenseFilters['missing'] },
  ] as const;

export const getPractitionerExperienceFilters = (t: Translations) =>
  [
    { value: 'all', label: t.constants.experienceFilters['all'] },
    { value: '0-2', label: t.constants.experienceFilters['0-2'] },
    { value: '3-5', label: t.constants.experienceFilters['3-5'] },
    { value: '6-10', label: t.constants.experienceFilters['6-10'] },
    { value: '10+', label: t.constants.experienceFilters['10+'] },
  ] as const;

export type PractitionerFilterState = {
  search: string;
  status: string;
  departmentId: string;
  employmentType: string;
  gender: string;
  language: string;
  specialty: string;
  roomId: string;
  nationality: string;
  license: string;
  experience: string;
  sort: string;
};

export const INITIAL_PRACTITIONER_FILTERS: PractitionerFilterState = {
  search: '',
  status: 'all',
  departmentId: '',
  employmentType: '',
  gender: '',
  language: '',
  specialty: '',
  roomId: '',
  nationality: '',
  license: 'all',
  experience: 'all',
  sort: DEFAULT_PRACTITIONER_SORT,
};

export function uniqueSorted(
  values: (string | null | undefined)[] | undefined,
) {
  return [
    ...new Set((values ?? []).filter((v): v is string => Boolean(v?.trim()))),
  ].sort((a, b) => a.localeCompare(b));
}
