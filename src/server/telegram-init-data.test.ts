import assert from "node:assert/strict";
import { describe, it, type TestContext } from "node:test";
import { validateInitData } from "./telegram-init-data";

// A fake token: the fixtures below were signed with it the same way Telegram does.
const BOT_TOKEN = "1234567890:test-token";
const AUTH_DATE = 1793491200; // 2026-11-01T00:00:00Z
const HOUR = 60 * 60;

// Looks like what Telegram sends: fields are not in alphabetical order,
// values are URL-encoded, the first name has Cyrillic letters and "&".
const VALID =
  "user=%7B%22id%22%3A42%2C%22first_name%22%3A%22%D0%92%D0%B8%D1%82%D1%8F%20%26%20Co%22%2C%22last_name%22%3A%22%D0%A2%D0%B5%D1%81%D1%82%D0%BE%D0%B2%22%2C%22username%22%3A%22vitya_test%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-8401234567890123456&chat_type=private&auth_date=1793491200&signature=q8z0Yb2bXk9oH1tF3sVn6wLpRmA4cE7uJ5dG2iK0xYzT1vB8nQ3wE6rT9yU2iO5pA7sD0fG3hJ6kL9zX2cV5bN8mQ&query_id=AAHdF6IQAAAAAN0XohDhrOrc&hash=f1e52adb105887559cac28a8f017839dbab1ce973767ab127de586a1f729fa71";

// Correctly signed, but without the user field.
const NO_USER =
  "query_id=AAHdF6IQAAAAAN0XohDhrOrc&auth_date=1793491200&hash=254256a65ff4f719147139d1845bb26b5e0ca45d5b02ad7ac53ed5a433c50d28";

// Pretends that the current time is `secondsAfterAuth` seconds after AUTH_DATE.
function setNow(t: TestContext, secondsAfterAuth: number) {
  t.mock.timers.enable({
    apis: ["Date"],
    now: (AUTH_DATE + secondsAfterAuth) * 1000,
  });
}

describe("validateInitData", () => {
  describe("signature", () => {
    it("accepts data signed with our bot token", (t) => {
      setNow(t, 60);

      assert.deepEqual(validateInitData(VALID, BOT_TOKEN), {
        user: {
          id: 42,
          first_name: "Витя & Co",
          last_name: "Тестов",
          username: "vitya_test",
          language_code: "ru",
          allows_write_to_pm: true,
        },
        authDate: AUTH_DATE,
      });
    });

    it("returns user: null when Telegram didn't send a user", (t) => {
      setNow(t, 60);

      assert.deepEqual(validateInitData(NO_USER, BOT_TOKEN), {
        user: null,
        authDate: AUTH_DATE,
      });
    });

    it("rejects data signed with another bot's token", (t) => {
      setNow(t, 60);

      assert.equal(validateInitData(VALID, "999:other-bot-token"), null);
    });

    it("rejects data changed after signing", (t) => {
      setNow(t, 60);
      const tampered = VALID.replace("vitya_test", "vitya_hack");

      assert.equal(validateInitData(tampered, BOT_TOKEN), null);
    });

    it("rejects a moved auth_date (trying to extend the lifetime)", (t) => {
      setNow(t, 60);
      const tampered = VALID.replace(
        "auth_date=1793491200",
        "auth_date=1793577600",
      );

      assert.equal(validateInitData(tampered, BOT_TOKEN), null);
    });
  });

  describe("broken input", () => {
    it("rejects an empty string", (t) => {
      setNow(t, 60);

      assert.equal(validateInitData("", BOT_TOKEN), null);
    });

    it("rejects data without hash", (t) => {
      setNow(t, 60);
      const withoutHash = VALID.split("&hash=")[0];

      assert.equal(validateInitData(withoutHash, BOT_TOKEN), null);
    });

    it("rejects a hash that is not hex", (t) => {
      setNow(t, 60);
      const badHash = VALID.split("&hash=")[0] + "&hash=not-a-hex-string";

      assert.equal(validateInitData(badHash, BOT_TOKEN), null);
    });

    it("rejects a hash of the wrong length", (t) => {
      setNow(t, 60);
      const shortHash = VALID.split("&hash=")[0] + "&hash=abcd";

      assert.equal(validateInitData(shortHash, BOT_TOKEN), null);
    });
  });

  describe("age", () => {
    it("accepts data younger than one day by default", (t) => {
      setNow(t, 23 * HOUR);

      assert.notEqual(validateInitData(VALID, BOT_TOKEN), null);
    });

    it("rejects data older than one day by default", (t) => {
      setNow(t, 25 * HOUR);

      assert.equal(validateInitData(VALID, BOT_TOKEN), null);
    });

    it("respects a custom max age", (t) => {
      setNow(t, 2 * HOUR);

      assert.equal(validateInitData(VALID, BOT_TOKEN, HOUR), null);
    });
  });
});
