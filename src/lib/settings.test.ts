import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  effectiveOpeningHours,
  formatMinuteOfDay,
  formatPhone,
  isValidStartMinute,
  parsePhone,
  parseTelegramUsername,
} from "./settings";

const SETTINGS = {
  firstStartMinute: 540,
  lastStartMinute: 1200,
  isRoundTheClock: false,
  supportUsername: null,
  supportPhone: null,
};

describe("effectiveOpeningHours", () => {
  it("uses the hours the admin set", () => {
    assert.deepEqual(effectiveOpeningHours(SETTINGS), {
      firstStartMinute: 540,
      lastStartMinute: 1200,
    });
  });

  it("covers the whole day when the rental works round the clock", () => {
    const hours = effectiveOpeningHours({ ...SETTINGS, isRoundTheClock: true });
    // From 00:00 to 23:30.
    assert.deepEqual(hours, { firstStartMinute: 0, lastStartMinute: 1410 });
  });
});

describe("isValidStartMinute", () => {
  it("accepts times on the 30-minute step", () => {
    assert.equal(isValidStartMinute(0), true);
    assert.equal(isValidStartMinute(570), true);
    assert.equal(isValidStartMinute(1410), true);
  });

  it("rejects everything else", () => {
    assert.equal(isValidStartMinute(545), false);
    assert.equal(isValidStartMinute(1440), false);
    assert.equal(isValidStartMinute(-30), false);
    assert.equal(isValidStartMinute("540"), false);
  });
});

describe("formatMinuteOfDay", () => {
  it("shows minutes from midnight as a time", () => {
    assert.equal(formatMinuteOfDay(0), "00:00");
    assert.equal(formatMinuteOfDay(570), "09:30");
    assert.equal(formatMinuteOfDay(1200), "20:00");
  });
});

describe("parseTelegramUsername", () => {
  it("reads a username with or without @ and from a link", () => {
    assert.equal(parseTelegramUsername("wro_rent"), "wro_rent");
    assert.equal(parseTelegramUsername(" @wro_rent "), "wro_rent");
    assert.equal(parseTelegramUsername("https://t.me/wro_rent"), "wro_rent");
  });

  it("returns null for anything that can't be a username", () => {
    assert.equal(parseTelegramUsername(""), null);
    assert.equal(parseTelegramUsername("abc"), null);
    assert.equal(parseTelegramUsername("имя"), null);
    assert.equal(parseTelegramUsername("two words"), null);
  });
});

describe("parsePhone", () => {
  it("drops spaces, dashes and brackets", () => {
    assert.equal(parsePhone("+48 123 456 789"), "+48123456789");
    assert.equal(parsePhone("(71) 123-45-67"), "711234567");
  });

  it("returns null for anything that can't be a phone number", () => {
    assert.equal(parsePhone(""), null);
    assert.equal(parsePhone("12345"), null);
    assert.equal(parsePhone("call me"), null);
    assert.equal(parsePhone("+48 123 abc"), null);
  });
});

describe("formatPhone", () => {
  it("splits a Polish number in threes", () => {
    assert.equal(formatPhone("+48722164925"), "+48 722 164 925");
    assert.equal(formatPhone("722164925"), "722 164 925");
  });

  it("leaves other numbers as they are", () => {
    assert.equal(formatPhone("+380501234567"), "+380501234567");
  });
});
