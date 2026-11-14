// The rental works in one city, so every date and time in the app is Warsaw
// time, whatever the time zone of the customer's phone or of the server.
import type { Enums } from "@/lib/database.types";
import type { Locale } from "@/lib/i18n/locales";

export const RENTAL_TIME_ZONE = "Europe/Warsaw";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// A calendar day in Warsaw. `month` is 1–12.
export type CalendarDay = {
  year: number;
  month: number;
  day: number;
};

// What a clock on a wall in Warsaw shows at some moment.
export type WallTime = CalendarDay & {
  hour: number;
  minute: number;
};

export type PlanDuration = {
  count: number;
  unit: Enums<"duration_unit">;
};

const wallTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: RENTAL_TIME_ZONE,
  // 0–23, so midnight is 0 and not 24.
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

export function toWallTime(date: Date): WallTime {
  const values: Record<string, number> = {};
  for (const part of wallTimeFormat.formatToParts(date)) {
    values[part.type] = Number(part.value);
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

// The moment when a clock in Warsaw shows this time.
// A day past the end of the month rolls over: 32 January is 1 February.
export function fromWallTime(wallTime: WallTime): Date {
  // The same numbers read as UTC. The real moment is earlier by Warsaw's
  // offset from UTC, which is one or two hours depending on the date.
  const asUtc = Date.UTC(
    wallTime.year,
    wallTime.month - 1,
    wallTime.day,
    wallTime.hour,
    wallTime.minute,
  );

  // The offset is known only for a moment, and the moment is what we look for.
  // So guess with the offset at `asUtc`, then correct with the offset at the
  // guess: they differ only within a few hours of a clock change.
  const guess = new Date(asUtc - warsawOffset(new Date(asUtc)));
  return new Date(asUtc - warsawOffset(guess));
}

// How far Warsaw's clock is ahead of UTC at this moment, in milliseconds.
function warsawOffset(date: Date): number {
  const wallTime = toWallTime(date);
  const wallTimeAsUtc = Date.UTC(
    wallTime.year,
    wallTime.month - 1,
    wallTime.day,
    wallTime.hour,
    wallTime.minute,
  );
  // Wall time has no seconds, so drop them from the moment too.
  const dateWithoutSeconds = Math.floor(date.getTime() / MINUTE) * MINUTE;
  return wallTimeAsUtc - dateWithoutSeconds;
}

// When a rental that starts at `start` ends: "1 day" from 10:00 ends at 10:00
// the next day on Warsaw's clock, also on the day the clocks change.
export function addDuration(start: Date, duration: PlanDuration): Date {
  if (duration.unit === "hour") {
    return new Date(start.getTime() + duration.count * HOUR);
  }

  const wallTime = toWallTime(start);

  if (duration.unit === "day") {
    return fromWallTime({ ...wallTime, day: wallTime.day + duration.count });
  }
  if (duration.unit === "week") {
    return fromWallTime({
      ...wallTime,
      day: wallTime.day + duration.count * 7,
    });
  }
  return fromWallTime(addMonths(wallTime, duration.count));
}

// 31 January plus a month is the last day of February, not 3 March.
function addMonths(wallTime: WallTime, count: number): WallTime {
  const monthsFromYearStart = wallTime.month - 1 + count;
  const year = wallTime.year + Math.floor(monthsFromYearStart / 12);
  const month = (monthsFromYearStart % 12) + 1;
  const lastDay = daysInMonth(year, month);

  return {
    ...wallTime,
    year,
    month,
    day: Math.min(wallTime.day, lastDay),
  };
}

export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function startOfDay(day: CalendarDay): Date {
  return fromWallTime({ ...day, hour: 0, minute: 0 });
}

export function toCalendarDay(date: Date): CalendarDay {
  const wallTime = toWallTime(date);
  return { year: wallTime.year, month: wallTime.month, day: wallTime.day };
}

// Reads "2026-12-07", the value of <input type="date">. Null if it isn't a date.
export function parseCalendarDay(text: string): CalendarDay | null {
  // Four digits, two digits, two digits, with dashes between.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return { year, month, day };
}

// Is `day` before `other` in the calendar?
export function isDayBefore(day: CalendarDay, other: CalendarDay): boolean {
  if (day.year !== other.year) {
    return day.year < other.year;
  }
  if (day.month !== other.month) {
    return day.month < other.month;
  }
  return day.day < other.day;
}

export function isSameDay(a: CalendarDay, b: CalendarDay): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

// "7 дек., 10:00"
export function formatDateTime(date: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: RENTAL_TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// "7 дек."
export function formatDate(date: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: RENTAL_TIME_ZONE,
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

// "10:00"
export function formatTime(date: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: RENTAL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// "7 дек., 10:00 → 8 дек., 10:00"
export function formatPeriod(
  startsAt: Date | string,
  endsAt: Date | string,
  locale: Locale,
): string {
  return `${formatDateTime(startsAt, locale)} → ${formatDateTime(endsAt, locale)}`;
}
