import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { TelegramUser } from "@/lib/telegram/types";

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

export type InitData = {
  user: TelegramUser | null;
  authDate: number;
};

// Checks that initData was signed by Telegram for our bot and is not too old.
// Returns null if the data is forged, broken or expired.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = ONE_DAY_IN_SECONDS,
): InitData | null {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    return null;
  }
  params.delete("hash");

  // All remaining fields as "key=value", sorted by key, one per line.
  const pairs: string[] = [];
  for (const [key, value] of params) {
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const expectedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest();
  const receivedHash = Buffer.from(hash, "hex");

  // timingSafeEqual avoids leaking how many bytes matched through response time.
  if (receivedHash.length !== expectedHash.length) {
    return null;
  }
  if (!timingSafeEqual(receivedHash, expectedHash)) {
    return null;
  }

  const authDate = Number(params.get("auth_date"));
  const ageSeconds = Date.now() / 1000 - authDate;
  if (!authDate || ageSeconds > maxAgeSeconds) {
    return null;
  }

  const userJson = params.get("user");
  let user: TelegramUser | null = null;
  if (userJson) {
    user = JSON.parse(userJson) as TelegramUser;
  }

  return { user, authDate };
}
