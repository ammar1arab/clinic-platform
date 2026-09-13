'use client';

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  ReactNode,
  useCallback,
} from 'react';
import { Direction } from 'radix-ui';
import { translations, getLanguage } from '@/i18n';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

function languageDir(language: Language): 'ltr' | 'rtl' {
  return language === 'ar' ? 'rtl' : 'ltr';
}

function applyLanguageToDocument(language: Language) {
  const root = document.documentElement;
  const dir = languageDir(language);
  if (root.lang !== language) root.lang = language;
  if (root.dir !== dir) root.dir = dir;
}

function getServerLanguageSnapshot(): Language {
  return 'en';
}

function subscribeToLanguage(onChange: () => void) {
  const sync = () => {
    applyLanguageToDocument(getLanguage());
    onChange();
  };
  applyLanguageToDocument(getLanguage());
  window.addEventListener('languagechange', sync);
  window.addEventListener('storage', sync);
  return () => {
    window.removeEventListener('languagechange', sync);
    window.removeEventListener('storage', sync);
  };
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguage,
    getServerLanguageSnapshot,
  );

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('language', lang);
    applyLanguageToDocument(lang);
    window.dispatchEvent(new Event('languagechange'));
  }, []);

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      lang: language,
      setLanguage,
      t: translations[language],
      dir: languageDir(language),
    }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      <Direction.Provider dir={value.dir}>{children}</Direction.Provider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
