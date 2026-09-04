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
