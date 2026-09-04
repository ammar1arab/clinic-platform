import { getTranslations, type Translations } from '@/i18n';
export function calcAge(
  dob: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (dob == null || dob === '') return null;
  const birth = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  if (age < 0 || age > 130) return null;
  return age;
}

export function ageLabel(
  dob: string | Date | null | undefined,
  now: Date = new Date(),
  t: Translations = getTranslations(),
): string {
  const age = calcAge(dob, now);
  const suffix = t.common.years;
  return age == null ? '' : `${age} ${suffix}`;
}
