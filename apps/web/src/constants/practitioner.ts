import type { Practitioner } from '@/services/practitioners.service';

export const PRACTITIONER_EMPLOYMENT_LABEL: Record<string, string> = {
  salaried: 'Salaried',
  commission: 'Commission',
  mixed: 'Mixed',
};

export const PRACTITIONER_EMPLOYMENT_VARIANT: Record<
  string,
  'secondary' | 'warning' | 'info'
> = {
  salaried: 'secondary',
  commission: 'warning',
  mixed: 'info',
};

export const PRACTITIONER_LANGUAGES = [
  { value: 'ar', label: 'Arabic' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'tr', label: 'Turkish' },
  { value: 'ru', label: 'Russian' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ur', label: 'Urdu' },
] as const;

export function languageLabelList(codes: string[] | null | undefined): string[] {
  if (!codes?.length) return [];
  const map = Object.fromEntries(
    PRACTITIONER_LANGUAGES.map((l) => [l.value, l.label]),
  );
  return codes.map((code) => map[code] ?? code);
}

export function languageLabels(codes: string[] | null | undefined): string {
  return languageLabelList(codes).join(', ');
}

export const WEEKDAY_OPTIONS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const PRACTITIONER_SORTS = [
  { value: 'name:asc', label: 'Name (A-Z)' },
  { value: 'name:desc', label: 'Name (Z-A)' },
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'department:asc', label: 'Department' },
  { value: 'specialty:asc', label: 'Specialty' },
  { value: 'experience:desc', label: 'Most experience' },
  { value: 'experience:asc', label: 'Least experience' },
  { value: 'licenseExpiry:asc', label: 'License expiring soon' },
] as const;

export const DEFAULT_PRACTITIONER_SORT = 'name:asc';

export const PRACTITIONER_LICENSE_FILTERS = [
  { value: 'all', label: 'Any license' },
  { value: 'valid', label: 'Valid' },
  { value: 'expiring', label: 'Expiring (60 days)' },
  { value: 'expired', label: 'Expired' },
  { value: 'missing', label: 'Missing' },
] as const;

export const PRACTITIONER_EXPERIENCE_FILTERS = [
  { value: 'all', label: 'Any experience' },
  { value: '0-2', label: '0-2 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '6-10', label: '6-10 years' },
  { value: '10+', label: '10+ years' },
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
