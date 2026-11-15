// Settings of the rental that the admin changes in the mini app.
import { BOOKING_RULES } from "@/lib/booking-rules";

// When a rental can start during a day, in minutes from midnight (Warsaw
// time): { firstStartMinute: 540, lastStartMinute: 1200 } is 9:00–20:00.
export type OpeningHours = {
  firstStartMinute: number;
  lastStartMinute: number;
};

export type RentalSettings = OpeningHours & {
  // True: a rental can start at any time of day; the two times are ignored.
  isRoundTheClock: boolean;
  // Telegram username customers write to, without "@". Null — not set.
  supportUsername: string | null;
  // A phone number customers can call: "+48123456789". Null — not set.
  supportPhone: string | null;
};

// GET, PATCH /api/admin/settings
export type AdminSettingsResponse = { settings: RentalSettings };

// GET /api/settings: the part of the settings every user may see.
export type PublicSettingsResponse = {
  supportUsername: string | null;
  supportPhone: string | null;
};

const MINUTES_IN_DAY = 24 * 60;

// The hours start times are really offered in. "Round the clock" is
// from midnight to the last time step of the day, 23:30.
export function effectiveOpeningHours(settings: RentalSettings): OpeningHours {
  if (settings.isRoundTheClock) {
    return {
      firstStartMinute: 0,
      lastStartMinute: MINUTES_IN_DAY - BOOKING_RULES.timeStepMinutes,
    };
  }
  return {
    firstStartMinute: settings.firstStartMinute,
    lastStartMinute: settings.lastStartMinute,
  };
}

// Every time of day a rental can be set to start at: 0, 30, 60 … 1410.
export function listMinutesOfDay(): number[] {
  const minutes: number[] = [];
  for (
    let minute = 0;
    minute < MINUTES_IN_DAY;
    minute += BOOKING_RULES.timeStepMinutes
  ) {
    minutes.push(minute);
  }
  return minutes;
}

export function isValidStartMinute(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < MINUTES_IN_DAY &&
    value % BOOKING_RULES.timeStepMinutes === 0
  );
}

// 540 → "09:00"
export function formatMinuteOfDay(minuteOfDay: number): string {
  const hours = String(Math.floor(minuteOfDay / 60)).padStart(2, "0");
  const minutes = String(minuteOfDay % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Reads a Telegram username typed by a person: "wro_rent", "@wro_rent" or
// "https://t.me/wro_rent" all give "wro_rent". Null when it isn't a username.
export function parseTelegramUsername(text: string): string | null {
  let username = text.trim();
  username = username.replace("https://t.me/", "").replace("t.me/", "");
  if (username.startsWith("@")) {
    username = username.slice(1);
  }
  // Telegram usernames: 4–32 latin letters, digits and underscores.
  if (!/^[A-Za-z0-9_]{4,32}$/.test(username)) {
    return null;
  }
  return username;
}

// Reads a phone number typed by a person: "+48 123 456 789" or
// "123-456-789" give "+48123456789" and "123456789". Null when it isn't one.
export function parsePhone(text: string): string | null {
  // Spaces, dashes and brackets are only for reading.
  const phone = text.replace(/[\s\-()]/g, "");
  // An optional "+", then 6–15 digits.
  if (!/^\+?\d{6,15}$/.test(phone)) {
    return null;
  }
  return phone;
}

// A stored phone number written for reading: "+48722164925" → "+48 722 164 925".
// Polish numbers (9 digits, with or without +48) are split in threes;
// anything else is shown as it was stored.
export function formatPhone(phone: string): string {
  let prefix = "";
  let digits = phone;
  if (phone.startsWith("+48")) {
    prefix = "+48 ";
    digits = phone.slice(3);
  }
  // Exactly nine digits.
  if (!/^\d{9}$/.test(digits)) {
    return phone;
  }
  return `${prefix}${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}
