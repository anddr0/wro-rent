import type { Locale } from "./locales";
import { en } from "./messages/en";
import { pl } from "./messages/pl";
import type { MessageKey, PluralForms } from "./messages/ru";
import { ru } from "./messages/ru";
import { uk } from "./messages/uk";

const MESSAGES = { pl, en, uk, ru };

export type TranslateParams = Record<string, string | number>;
export type Translate = (key: MessageKey, params?: TranslateParams) => string;

// Returns t() for one language. t("bikes.title") gives the text,
// t("bikes.available", { count: 3 }) also picks the plural form and fills in {count}.
export function createTranslate(locale: Locale): Translate {
  const messages = MESSAGES[locale];
  const pluralRules = new Intl.PluralRules(locale);

  return function t(key, params = {}) {
    const message = messages[key];

    let text: string;
    if (typeof message === "string") {
      text = message;
    } else {
      text = pickPluralForm(message, pluralRules, params.count);
    }

    return fillParams(text, params);
  };
}

// Russian and Polish have more than two plural forms: 1 rower, 3 rowery, 5 rowerów.
// Intl.PluralRules knows which form a number takes in each language.
function pickPluralForm(
  forms: PluralForms,
  pluralRules: Intl.PluralRules,
  count: string | number | undefined,
): string {
  if (typeof count !== "number") {
    return forms.other;
  }
  const category = pluralRules.select(count);
  return forms[category] ?? forms.other;
}

// Replaces {name} in the text with params.name. Unknown names stay as they are,
// so a forgotten param is visible on the screen instead of silently empty.
function fillParams(text: string, params: TranslateParams): string {
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params[name];
    if (value === undefined) {
      return placeholder;
    }
    return String(value);
  });
}
