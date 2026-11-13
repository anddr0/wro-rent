"use client";

import { createContext, use, useMemo } from "react";
import { DEFAULT_LOCALE } from "./locales";
import type { Locale } from "./locales";
import { createTranslate } from "./translate";
import type { Translate } from "./translate";

// The language of the app right now. CurrentUserProvider sets it
// from the user's choice or from Telegram.
export const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function useLocale(): Locale {
  return use(LocaleContext);
}

// t() for the current language: const t = useT(); t("common.save").
export function useT(): Translate {
  const locale = useLocale();
  return useMemo(() => createTranslate(locale), [locale]);
}
