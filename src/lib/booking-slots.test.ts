import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isStartAllowed,
  listBookableDays,
  listStartSlots,
  overlapsAny,
} from "./booking-slots";
import type { Availability } from "./booking-slots";

// Monday 7 December 2026, 12:10 in Warsaw (winter time, UTC+1).
const NOW = new Date("2026-12-07T11:10:00Z");
const ONE_DAY = { count: 1, unit: "day" } as const;
const NOTHING_BOOKED: Availability = { busy: [], pending: [] };

describe("isStartAllowed", () => {
  it("accepts a time on the step, in opening hours, inside the window", () => {
    assert.equal(isStartAllowed(new Date("2026-12-08T09:30:00Z"), NOW), true);
  });

  it("rejects a time off the 30-minute step", () => {
    assert.equal(isStartAllowed(new Date("2026-12-08T09:15:00Z"), NOW), false);
    assert.equal(isStartAllowed(new Date("2026-12-08T09:30:20Z"), NOW), false);
  });

  it("rejects a time outside the opening hours", () => {
    // 08:30 and 20:30 in Warsaw.
    assert.equal(isStartAllowed(new Date("2026-12-08T07:30:00Z"), NOW), false);
    assert.equal(isStartAllowed(new Date("2026-12-08T19:30:00Z"), NOW), false);
  });

  it("accepts the first and the last start time of a day", () => {
    // 09:00 and 20:00 in Warsaw.
    assert.equal(isStartAllowed(new Date("2026-12-08T08:00:00Z"), NOW), true);
    assert.equal(isStartAllowed(new Date("2026-12-08T19:00:00Z"), NOW), true);
  });

  it("rejects a start sooner than in an hour", () => {
    // 13:00 in Warsaw is 50 minutes from now, 13:30 is 80 minutes.
    assert.equal(isStartAllowed(new Date("2026-12-07T12:00:00Z"), NOW), false);
    assert.equal(isStartAllowed(new Date("2026-12-07T12:30:00Z"), NOW), true);
  });

  it("rejects a start later than in 30 days", () => {
    assert.equal(isStartAllowed(new Date("2027-01-06T09:00:00Z"), NOW), true);
    assert.equal(isStartAllowed(new Date("2027-01-07T09:00:00Z"), NOW), false);
  });
});

describe("listBookableDays", () => {
  it("lists every day from today to the end of the window", () => {
    const days = listBookableDays(NOW);
    assert.deepEqual(days[0], { year: 2026, month: 12, day: 7 });
    assert.deepEqual(days[days.length - 1], { year: 2027, month: 1, day: 6 });
    assert.equal(days.length, 31);
  });
});

describe("listStartSlots", () => {
  it("leaves out the times of today that are too soon", () => {
    const today = { year: 2026, month: 12, day: 7 };
    const slots = listStartSlots(today, ONE_DAY, NOTHING_BOOKED, NOW);
    // The first one is 13:30 in Warsaw.
    assert.equal(slots[0].startsAt.toISOString(), "2026-12-07T12:30:00.000Z");
  });

  it("lists a whole day from 9:00 to 20:00 with the end of each rental", () => {
    const tomorrow = { year: 2026, month: 12, day: 8 };
    const slots = listStartSlots(tomorrow, ONE_DAY, NOTHING_BOOKED, NOW);
    assert.equal(slots.length, 23);
    assert.equal(slots[0].startsAt.toISOString(), "2026-12-08T08:00:00.000Z");
    assert.equal(slots[0].endsAt.toISOString(), "2026-12-09T08:00:00.000Z");
    assert.equal(slots[22].startsAt.toISOString(), "2026-12-08T19:00:00.000Z");
  });

  it("marks the starts that would overlap a confirmed booking", () => {
    const tomorrow = { year: 2026, month: 12, day: 8 };
    // Someone has the bike from 9 December 12:00 Warsaw time.
    const availability: Availability = {
      busy: [
        { startsAt: "2026-12-09T11:00:00Z", endsAt: "2026-12-10T11:00:00Z" },
      ],
      pending: [],
    };
    const slots = listStartSlots(tomorrow, ONE_DAY, availability, NOW);

    // A day from 12:00 ends exactly when the other rental starts: free.
    const noon = slots.find(
      (slot) => slot.startsAt.toISOString() === "2026-12-08T11:00:00.000Z",
    );
    // A day from 12:30 would run into it: busy.
    const halfPastNoon = slots.find(
      (slot) => slot.startsAt.toISOString() === "2026-12-08T11:30:00.000Z",
    );
    assert.equal(noon?.isBusy, false);
    assert.equal(halfPastNoon?.isBusy, true);
  });

  it("marks the starts someone else is waiting for, without blocking them", () => {
    const tomorrow = { year: 2026, month: 12, day: 8 };
    const availability: Availability = {
      busy: [],
      pending: [
        { startsAt: "2026-12-08T08:00:00Z", endsAt: "2026-12-09T08:00:00Z" },
      ],
    };
    const slots = listStartSlots(tomorrow, ONE_DAY, availability, NOW);
    assert.equal(slots[0].isBusy, false);
    assert.equal(slots[0].hasPendingRequests, true);
  });
});

describe("overlapsAny", () => {
  const periods = [
    { startsAt: "2026-12-08T10:00:00Z", endsAt: "2026-12-09T10:00:00Z" },
  ];

  it("finds an overlap", () => {
    const startsAt = new Date("2026-12-09T09:00:00Z");
    const endsAt = new Date("2026-12-10T09:00:00Z");
    assert.equal(overlapsAny(startsAt, endsAt, periods), true);
  });

  it("lets a rental start when the previous one ends", () => {
    const startsAt = new Date("2026-12-09T10:00:00Z");
    const endsAt = new Date("2026-12-10T10:00:00Z");
    assert.equal(overlapsAny(startsAt, endsAt, periods), false);
  });
});
