// Which start times a customer can pick (К-3). Used by the calendar in the
// mini app and by the server when it checks a new request.
import { BOOKING_RULES } from "@/lib/booking-rules";
import {
  addDuration,
  fromWallTime,
  isSameDay,
  toCalendarDay,
  toWallTime,
} from "@/lib/rental-time";
import type { CalendarDay, PlanDuration } from "@/lib/rental-time";
import type { OpeningHours } from "@/lib/settings";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// A stretch of time, as ISO strings: the way it comes from the API.
export type Period = {
  startsAt: string;
  endsAt: string;
};

export type Availability = {
  // Confirmed and active bookings: a rental can't overlap them.
  busy: Period[];
  // Times an admin closed the bike for by hand (repair and the like).
  // A rental can't overlap them either; they are only drawn differently.
  unavailable: Period[];
  // Other customers' requests waiting for an answer: only a warning.
  pending: Period[];
  // The hours of a day a rental can start in.
  hours: OpeningHours;
};

export type StartSlot = {
  startsAt: Date;
  endsAt: Date;
  // The rental would overlap a confirmed or active booking.
  isRented: boolean;
  // The rental would overlap a time the admin closed the bike for.
  isClosed: boolean;
  // Either of the two: this start can't be picked.
  isBusy: boolean;
  // Someone else already asked for this time.
  hasPendingRequests: boolean;
};

// The earliest and the latest moment a rental can start, counted from now.
export function bookingWindow(now: Date): { earliest: Date; latest: Date } {
  return {
    earliest: new Date(
      now.getTime() + BOOKING_RULES.minHoursBeforeStart * HOUR,
    ),
    latest: new Date(now.getTime() + BOOKING_RULES.maxDaysAhead * DAY),
  };
}

// Every day the calendar can offer: from today to the last day of the window.
export function listBookableDays(now: Date): CalendarDay[] {
  const { earliest, latest } = bookingWindow(now);
  const lastDay = toCalendarDay(latest);

  const days: CalendarDay[] = [];
  let current = toCalendarDay(earliest);
  // The window is about a month, the limit only guards against an endless loop.
  while (days.length < 400) {
    days.push(current);
    if (isSameDay(current, lastDay)) {
      break;
    }
    // Noon, so a clock change can't move the next day's date.
    const nextNoon = fromWallTime({
      ...current,
      day: current.day + 1,
      hour: 12,
      minute: 0,
    });
    current = toCalendarDay(nextNoon);
  }
  return days;
}

// Is this a start time we offer: on the time step, within the opening hours
// and inside the booking window?
export function isStartAllowed(
  startsAt: Date,
  now: Date,
  hours: OpeningHours,
): boolean {
  const wallTime = toWallTime(startsAt);
  const hasSecondsOrMs = startsAt.getTime() % MINUTE !== 0;
  if (hasSecondsOrMs) {
    return false;
  }
  if (wallTime.minute % BOOKING_RULES.timeStepMinutes !== 0) {
    return false;
  }

  const minutesOfDay = wallTime.hour * 60 + wallTime.minute;
  if (minutesOfDay < hours.firstStartMinute) {
    return false;
  }
  if (minutesOfDay > hours.lastStartMinute) {
    return false;
  }

  const { earliest, latest } = bookingWindow(now);
  return startsAt >= earliest && startsAt <= latest;
}

// The start times of one day for a plan of this duration, in order.
// Times outside the booking window are left out; busy ones are marked.
export function listStartSlots(
  day: CalendarDay,
  duration: PlanDuration,
  availability: Availability,
  now: Date,
): StartSlot[] {
  const { hours } = availability;

  const slots: StartSlot[] = [];
  for (
    let minutesOfDay = hours.firstStartMinute;
    minutesOfDay <= hours.lastStartMinute;
    minutesOfDay += BOOKING_RULES.timeStepMinutes
  ) {
    const startsAt = fromWallTime({
      ...day,
      hour: Math.floor(minutesOfDay / 60),
      minute: minutesOfDay % 60,
    });
    if (!isStartAllowed(startsAt, now, hours)) {
      continue;
    }

    const endsAt = addDuration(startsAt, duration);
    const isRented = overlapsAny(startsAt, endsAt, availability.busy);
    const isClosed = overlapsAny(startsAt, endsAt, availability.unavailable);
    slots.push({
      startsAt,
      endsAt,
      isRented,
      isClosed,
      isBusy: isRented || isClosed,
      hasPendingRequests: overlapsAny(startsAt, endsAt, availability.pending),
    });
  }
  return slots;
}

// How a day looks in the calendar:
// free — at least one start time can be picked;
// rented — nothing is free, and bookings are (at least part of) the reason;
// closed — nothing is free only because the admin closed the bike;
// none — no start times at all (the day is over, or outside the window).
export type DayState = "free" | "rented" | "closed" | "none";

export function dayState(slots: StartSlot[]): DayState {
  if (slots.length === 0) {
    return "none";
  }
  if (slots.some((slot) => !slot.isBusy)) {
    return "free";
  }
  if (slots.some((slot) => slot.isRented)) {
    return "rented";
  }
  return "closed";
}

// Two periods overlap when each starts before the other ends. Touching ones
// don't: a rental may start at the minute the previous one ends.
export function overlapsAny(
  startsAt: Date,
  endsAt: Date,
  periods: Period[],
): boolean {
  for (const period of periods) {
    const periodStart = new Date(period.startsAt);
    const periodEnd = new Date(period.endsAt);
    if (startsAt < periodEnd && periodStart < endsAt) {
      return true;
    }
  }
  return false;
}
