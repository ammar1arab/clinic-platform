import { en } from './en';
import { ar } from './ar';
export { en as SHARED_EN, ar as SHARED_AR };
export const getSharedTranslations = (locale: 'en' | 'ar') => locale === 'ar' ? ar : en;
