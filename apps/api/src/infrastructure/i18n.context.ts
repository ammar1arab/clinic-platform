import { AsyncLocalStorage } from "async_hooks";

export type Locale = "en" | "ar";

export const i18nContext = new AsyncLocalStorage<Locale>();

export function getLocale(): Locale {
  return i18nContext.getStore() || "en";
}
