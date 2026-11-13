import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveLocale } from "./locales";
import { pl } from "./messages/pl";
import { ru } from "./messages/ru";
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

  it("ignores a picked language that has no translation yet", () => {
    assert.equal(resolveLocale("en", "ru"), "ru");
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
    for (const key of Object.keys(ru) as (keyof typeof ru)[]) {
      assert.equal(
        typeof pl[key],
        typeof ru[key],
        `"${key}" is plural in one language and plain in the other`,
      );
    }
  });
});
