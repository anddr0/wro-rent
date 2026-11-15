// Times when a bike can't be rented because an admin said so (repair and
// the like): what the API sends to the mini app, and how a period is shown.
import type { Locale } from "@/lib/i18n/locales";
import {
  formatDate,
  formatDateTime,
  formatTime,
  fromWallTime,
  isSameDay,
  toCalendarDay,
  toWallTime,
} from "@/lib/rental-time";
import type { CalendarDay } from "@/lib/rental-time";

// Dates are ISO strings.
export type UnavailablePeriod = {
  id: string;
  startsAt: string;
  endsAt: string;
};

// GET /api/admin/bikes/[id]/unavailable: the periods that aren't over yet.
export type UnavailablePeriodsResponse = { periods: UnavailablePeriod[] };

// The body of POST /api/admin/bikes/[id]/unavailable.
export type NewUnavailablePeriod = {
  startsAt: string;
  endsAt: string;
};

// The longest period an admin can add, in days: longer is surely a typo,
// and a bike that is gone for good is archived instead.
export const MAX_UNAVAILABLE_DAYS = 366;

// A period of whole days from `firstDay` to `lastDay`, both included:
// from the first midnight to the midnight after the last day (Warsaw time).
export function wholeDaysPeriod(
  firstDay: CalendarDay,
  lastDay: CalendarDay,
): NewUnavailablePeriod {
  const start = fromWallTime({ ...firstDay, hour: 0, minute: 0 });
  const end = fromWallTime({
    ...lastDay,
    day: lastDay.day + 1,
    hour: 0,
    minute: 0,
  });
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

// A period from a time on `firstDay` to a time on `lastDay`. The times are
// minutes from midnight (Warsaw time): 540 is 9:00.
export function timedPeriod(
  firstDay: CalendarDay,
  startMinute: number,
  lastDay: CalendarDay,
  endMinute: number,
): NewUnavailablePeriod {
  const start = fromWallTime({
    ...firstDay,
    hour: Math.floor(startMinute / 60),
    minute: startMinute % 60,
  });
  const end = fromWallTime({
    ...lastDay,
    hour: Math.floor(endMinute / 60),
    minute: endMinute % 60,
  });
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

export type PeriodLabel = {
  // "20 нояб. – 24 нояб." or "28 нояб., 09:00 – 14:00".
  text: string;
  // True when the period is whole days, midnight to midnight.
  isWholeDays: boolean;
};

// How a period is written in the admin's list.
export function describePeriod(
  period: { startsAt: string; endsAt: string },
  locale: Locale,
): PeriodLabel {
  const start = new Date(period.startsAt);
  const end = new Date(period.endsAt);
  const startTime = toWallTime(start);
  const endTime = toWallTime(end);

  const startsAtMidnight = startTime.hour === 0 && startTime.minute === 0;
  const endsAtMidnight = endTime.hour === 0 && endTime.minute === 0;

  if (startsAtMidnight && endsAtMidnight) {
    // The period ends at the midnight after its last day, so the last day
    // is the one before: a minute earlier is still inside it.
    const lastMoment = new Date(end.getTime() - 60 * 1000);
    if (isSameDay(toCalendarDay(start), toCalendarDay(lastMoment))) {
      return { text: formatDate(start, locale), isWholeDays: true };
    }
    return {
      text: `${formatDate(start, locale)} – ${formatDate(lastMoment, locale)}`,
      isWholeDays: true,
    };
  }

  if (isSameDay(toCalendarDay(start), toCalendarDay(end))) {
    return {
      text: `${formatDateTime(start, locale)} – ${formatTime(end, locale)}`,
      isWholeDays: false,
    };
  }
  return {
    text: `${formatDateTime(start, locale)} – ${formatDateTime(end, locale)}`,
    isWholeDays: false,
  };
}
