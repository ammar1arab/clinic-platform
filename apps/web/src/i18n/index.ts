import { en } from './en';
import { ar } from './ar';

export const translations = { en, ar };
export type Translations = typeof en;

export type Language = keyof typeof translations;

export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('language') === 'ar' ? 'ar' : 'en';
}

export function getTranslations(
  language: string = getLanguage(),
): Translations {
  return translations[language === 'ar' ? 'ar' : 'en'];
}

export function getBilingualName(
  enName: string | null | undefined,
  arName: string | null | undefined,
  lang?: string,
): string {
  if (lang === 'ar' && arName) return arName;
  return enName ?? '';
}

export function getPersonName(
  person: {
    firstNameEn?: string | null;
    lastNameEn?: string | null;
    firstNameAr?: string | null;
    lastNameAr?: string | null;
  },
  lang?: string,
) {
  if (lang === 'ar') {
    const arName = `${person.firstNameAr ?? ''} ${person.lastNameAr ?? ''}`.trim();
    if (arName) return arName;
  }
  return `${person.firstNameEn ?? ''} ${person.lastNameEn ?? ''}`.trim();
}

export function getStaffName(
  person: {
    name?: string | null;
    nameAr?: string | null;
    title?: string | null;
  },
  lang?: string,
) {
  const name = getBilingualName(person.name, person.nameAr, lang);
  if (lang === 'ar' || !person.title) return name;
  return `${person.title} ${name}`;
}
