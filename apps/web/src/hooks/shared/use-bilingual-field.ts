"use client";

import { useLanguage } from "@/providers";

export function useBilingualField() {
  const { language } = useLanguage();

  return function getField(enValue?: string | null, arValue?: string | null): string {
    if (language === 'ar') {
      return arValue || enValue || '';
    }
    return enValue || arValue || '';
  };
}
