"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, useEffect, ReactNode, useCallback } from "react";
import { Direction } from "radix-ui";
import { translations } from "@/i18n";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getLanguageSnapshot(): Language {
  const saved = localStorage.getItem("language");
  return saved === "ar" ? "ar" : "en";
}

function getServerLanguageSnapshot(): Language {
  return "en";
}

function subscribeToLanguage(onChange: () => void) {
  window.addEventListener("languagechange", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("languagechange", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot,
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem("language", lang);
    window.dispatchEvent(new Event('languagechange'));
  }, []);

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      lang: language,
      setLanguage,
      t: translations[language] || translations.en,
      dir: language === "ar" ? "rtl" : "ltr",
    }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      <Direction.Provider dir={value.dir}>
        {children}
      </Direction.Provider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
