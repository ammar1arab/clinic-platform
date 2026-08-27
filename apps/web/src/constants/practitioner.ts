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
