// Languages the app has translations for. English and Ukrainian come before
// launch (slice 7): add their dictionaries and list them here.
export const LOCALES = ["pl", "ru"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pl";

// Each language is named in itself, so anyone finds their own in the list.
export const LOCALE_NAMES: Record<Locale, string> = {
  pl: "Polski",
  ru: "Русский",
};

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

// The language to show the app in: the one picked in settings, otherwise
// Telegram's language if we have it, otherwise Polish.
// languageCode comes from Telegram, e.g. "ru" or "pt-br".
export function resolveLocale(
  pickedLocale: string | null,
  languageCode: string | null | undefined,
): Locale {
  if (isLocale(pickedLocale)) {
    return pickedLocale;
  }

  const telegramLanguage = languageCode?.split("-")[0];
  if (isLocale(telegramLanguage)) {
    return telegramLanguage;
  }

  return DEFAULT_LOCALE;
}
