import { AsyncLocalStorage } from "async_hooks";
import type { Locale } from "@clinic/types";

export type { Locale };

export const i18nContext = new AsyncLocalStorage<Locale>();

export const getLocale = (): Locale => i18nContext.getStore() || "en";
