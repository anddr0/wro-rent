import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveLocale } from "./locales";
import { en } from "./messages/en";
import { pl } from "./messages/pl";
import { ru } from "./messages/ru";
import { uk } from "./messages/uk";
import { createTranslate } from "./translate";

describe("resolveLocale", () => {
  it("uses the language picked in settings", () => {
    assert.equal(resolveLocale("ru", "pl"), "ru");
  });

  it("uses Telegram's language when nothing is picked", () => {
    assert.equal(resolveLocale(null, "ru"), "ru");
  });

  it("reads regional Telegram codes like pl-PL", () => {
    assert.equal(resolveLocale(null, "pl-PL"), "pl");
  });

  it("falls back to Polish for languages we don't have", () => {
    assert.equal(resolveLocale(null, "de"), "pl");
    assert.equal(resolveLocale(null, null), "pl");
  });

  it("ignores a picked language the app doesn't have", () => {
    assert.equal(resolveLocale("de", "ru"), "ru");
  });

  it("knows all four languages", () => {
    assert.equal(resolveLocale(null, "en"), "en");
    assert.equal(resolveLocale(null, "uk"), "uk");
    assert.equal(resolveLocale("uk", "en"), "uk");
  });
});

describe("createTranslate", () => {
  it("returns the text in the given language", () => {
    assert.equal(createTranslate("pl")("common.save"), "Zapisz");
    assert.equal(createTranslate("ru")("common.save"), "Сохранить");
  });

  it("fills in params", () => {
    const t = createTranslate("ru");
    assert.equal(t("home.greeting", { name: "Андрей" }), "Привет, Андрей!");
  });

  it("leaves a missing param visible", () => {
    const t = createTranslate("ru");
    assert.equal(t("home.greeting"), "Привет, {name}!");
  });

  it("picks Russian plural forms", () => {
    const t = createTranslate("ru");
    assert.equal(t("adminHome.newRequests", { count: 1 }), "Новая заявка");
    assert.equal(t("adminHome.newRequests", { count: 3 }), "Новые заявки");
    assert.equal(t("adminHome.newRequests", { count: 5 }), "Новых заявок");
    assert.equal(t("adminHome.newRequests", { count: 21 }), "Новая заявка");
  });

  it("picks Polish plural forms", () => {
    const t = createTranslate("pl");
    assert.equal(t("adminHome.newRequests", { count: 1 }), "Nowe zgłoszenie");
    assert.equal(t("adminHome.newRequests", { count: 3 }), "Nowe zgłoszenia");
    assert.equal(t("adminHome.newRequests", { count: 5 }), "Nowych zgłoszeń");
    // Unlike Russian, 21 takes the "many" form in Polish.
    assert.equal(t("adminHome.newRequests", { count: 21 }), "Nowych zgłoszeń");
  });
});

describe("dictionaries", () => {
  it("translate plural texts with plural forms in every language", () => {
    const translations = { pl, en, uk };
    for (const [language, messages] of Object.entries(translations)) {
      for (const key of Object.keys(ru) as (keyof typeof ru)[]) {
        assert.equal(
          typeof messages[key],
          typeof ru[key],
          `"${key}" is plural in ru and plain in ${language}, or the other way`,
        );
      }
    }
  });

  it("keep the same {params} as the Russian text", () => {
    const translations = { pl, en, uk };
    for (const [language, messages] of Object.entries(translations)) {
      for (const key of Object.keys(ru) as (keyof typeof ru)[]) {
        assert.deepEqual(
          paramsOf(messages[key]),
          paramsOf(ru[key]),
          `"${key}" in ${language} has other {params} than in ru`,
        );
      }
    }
  });
});

describe("plural forms", () => {
  it("picks English forms", () => {
    const t = createTranslate("en");
    assert.equal(t("duration.day", { count: 1 }), "1 day");
    assert.equal(t("duration.day", { count: 3 }), "3 days");
  });

  it("picks Ukrainian forms", () => {
    const t = createTranslate("uk");
    assert.equal(t("duration.day", { count: 1 }), "1 день");
    assert.equal(t("duration.day", { count: 3 }), "3 дні");
    assert.equal(t("duration.day", { count: 5 }), "5 днів");
  });
});

// The names in {braces} a text uses, sorted: "{date} · {address}" → address, date.
// For a plural text — the names of all its forms together.
function paramsOf(message: string | Record<string, string>): string[] {
  let texts: string[] = [];
  if (typeof message === "string") {
    texts = [message];
  } else {
    texts = Object.values(message);
  }

  const names = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(/\{(\w+)\}/g)) {
      names.add(match[1]);
    }
  }
  return [...names].sort();
}
