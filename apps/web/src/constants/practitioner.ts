import type { Translations } from '@/i18n';
import type { Practitioner } from '@/services/practitioners.service';

export const getPractitionerEmploymentLabels = (t: Translations): Record<string, string> => t.constants.employment;

export const PRACTITIONER_EMPLOYMENT_VARIANT: Record<
  string,
  'secondary' | 'warning' | 'info'
> = {
  salaried: 'secondary',
  commission: 'warning',
  mixed: 'info',
};

export const getPractitionerLanguages = (t: Translations) => [
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

export function languageLabelList(codes: string[] | null | undefined, t: Translations): string[] {
  if (!codes?.length) return [];
  const map = Object.fromEntries(
    getPractitionerLanguages(t).map((l) => [l.value, l.label]),
  );
  return codes.map((code) => map[code] ?? code);
}

export function languageLabels(codes: string[] | null | undefined, t: Translations): string {
  return languageLabelList(codes, t).join(', ');
}

export const LANGUAGE_BADGE_VARIANT = ['info', 'success', 'warning', 'secondary'] as const;

export const WEEKDAY_OPTIONS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const getPractitionerSorts = (t: Translations) => [
  { value: 'name:asc', label: t.constants.practitionerSorts['name:asc'] },
  { value: 'name:desc', label: t.constants.practitionerSorts['name:desc'] },
  { value: 'createdAt:desc', label: t.constants.practitionerSorts['createdAt:desc'] },
  { value: 'createdAt:asc', label: t.constants.practitionerSorts['createdAt:asc'] },
  { value: 'department:asc', label: t.constants.practitionerSorts['department:asc'] },
  { value: 'specialty:asc', label: t.constants.practitionerSorts['specialty:asc'] },
  { value: 'experience:desc', label: t.constants.practitionerSorts['experience:desc'] },
  { value: 'experience:asc', label: t.constants.practitionerSorts['experience:asc'] },
  { value: 'licenseExpiry:asc', label: t.constants.practitionerSorts['licenseExpiry:asc'] },
] as const;

export const DEFAULT_PRACTITIONER_SORT = 'name:asc';

export const getPractitionerLicenseFilters = (t: Translations) => [
  { value: 'all', label: t.constants.licenseFilters['all'] },
  { value: 'valid', label: t.constants.licenseFilters['valid'] },
  { value: 'expiring', label: t.constants.licenseFilters['expiring'] },
  { value: 'expired', label: t.constants.licenseFilters['expired'] },
  { value: 'missing', label: t.constants.licenseFilters['missing'] },
] as const;

export const getPractitionerExperienceFilters = (t: Translations) => [
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

export function uniqueSorted(values: (string | null | undefined)[] | undefined) {
  return [...new Set((values ?? []).filter((v): v is string => Boolean(v?.trim())))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function licenseBucket(p: Practitioner, now: Date) {
  if (!p.licenseNumber && !p.licenseExpiry) return 'missing';
  if (!p.licenseExpiry) return p.licenseNumber ? 'valid' : 'missing';
  const expiry = new Date(p.licenseExpiry);
  if (Number.isNaN(expiry.getTime()) || expiry < now) return 'expired';
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 60);
  if (expiry <= soon) return 'expiring';
  return 'valid';
}

function experienceBucket(years: number) {
  if (years <= 2) return '0-2';
  if (years <= 5) return '3-5';
  if (years <= 10) return '6-10';
  return '10+';
}

export function applyPractitionerDirectory(
  items: Practitioner[] | undefined,
  filters: PractitionerFilterState,
): Practitioner[] {
  if (!items) return [];
  const term = filters.search.trim().toLowerCase();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filtered = items.filter((p) => {
    if (filters.status === 'active' && !p.isActive) return false;
    if (filters.status === 'inactive' && p.isActive) return false;
    if (filters.departmentId && p.departmentId !== filters.departmentId) return false;
    if (filters.employmentType && p.employmentType !== filters.employmentType) return false;
    if (filters.gender && p.gender !== filters.gender) return false;
    if (filters.language && !p.languages.includes(filters.language)) return false;
    if (filters.specialty && p.specialty !== filters.specialty) return false;
    if (filters.roomId && p.defaultRoomId !== filters.roomId) return false;
    if (filters.nationality && p.nationality !== filters.nationality) return false;
    if (filters.license !== 'all' && licenseBucket(p, now) !== filters.license) return false;
    if (filters.experience !== 'all') {
      if (p.experienceYears == null) return false;
      if (experienceBucket(p.experienceYears) !== filters.experience) return false;
    }
    if (term) {
      const fields = [
        p.name,
        p.nameAr,
        p.email,
        p.phone,
        p.departmentName,
        p.licenseNumber,
        p.specialty,
        p.title,
      ];
      if (!fields.some((f) => typeof f === 'string' && f.toLowerCase().includes(term))) {
        return false;
      }
    }
    return true;
  });

  const [key, dir] = filters.sort.split(':');
  const sign = dir === 'desc' ? -1 : 1;
  const cmp = (av: string | number | null | undefined, bv: string | number | null | undefined) => {
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign;
    return String(av).localeCompare(String(bv)) * sign;
  };

  return [...filtered].sort((a, b) => {
    if (key === 'name') return cmp(a.name, b.name);
    if (key === 'createdAt') return cmp(a.createdAt, b.createdAt);
    if (key === 'department') return cmp(a.departmentName, b.departmentName);
    if (key === 'specialty') return cmp(a.specialty, b.specialty);
    if (key === 'experience') return cmp(a.experienceYears, b.experienceYears);
    if (key === 'licenseExpiry') return cmp(a.licenseExpiry, b.licenseExpiry);
    return 0;
  });
}
