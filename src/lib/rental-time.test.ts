import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDuration, fromWallTime, toWallTime } from "./rental-time";

describe("toWallTime", () => {
  it("reads winter time, one hour ahead of UTC", () => {
    const wallTime = toWallTime(new Date("2026-12-07T09:00:00Z"));
    assert.deepEqual(wallTime, {
      year: 2026,
      month: 12,
      day: 7,
      hour: 10,
      minute: 0,
    });
  });

  it("reads summer time, two hours ahead of UTC", () => {
    const wallTime = toWallTime(new Date("2026-07-01T22:30:00Z"));
    assert.deepEqual(wallTime, {
      year: 2026,
      month: 7,
      day: 2,
      hour: 0,
      minute: 30,
    });
  });
});

describe("fromWallTime", () => {
  it("is the opposite of toWallTime", () => {
    const winter = new Date("2026-12-07T09:00:00Z");
    const summer = new Date("2026-07-01T22:30:00Z");
    assert.deepEqual(fromWallTime(toWallTime(winter)), winter);
    assert.deepEqual(fromWallTime(toWallTime(summer)), summer);
  });

  it("uses the new offset right after the clocks go forward", () => {
    // 29 March 2026: 02:00 becomes 03:00.
    const morning = fromWallTime({
      year: 2026,
      month: 3,
      day: 29,
      hour: 9,
      minute: 0,
    });
    assert.equal(morning.toISOString(), "2026-03-29T07:00:00.000Z");
  });

  it("rolls a day past the end of the month over", () => {
    const date = fromWallTime({
      year: 2026,
      month: 1,
      day: 32,
      hour: 10,
      minute: 0,
    });
    assert.equal(date.toISOString(), "2026-02-01T09:00:00.000Z");
  });
});

describe("addDuration", () => {
  it("adds hours", () => {
    const end = addDuration(new Date("2026-12-07T09:00:00Z"), {
      count: 3,
      unit: "hour",
    });
    assert.equal(end.toISOString(), "2026-12-07T12:00:00.000Z");
  });

  it("ends a one-day rental at the same time the next day", () => {
    const end = addDuration(new Date("2026-12-07T09:00:00Z"), {
      count: 1,
      unit: "day",
    });
    assert.equal(end.toISOString(), "2026-12-08T09:00:00.000Z");
  });

  it("keeps the time of day when the clocks change during the rental", () => {
    // 10:00 on 28 March is 09:00 UTC, 10:00 on 29 March is 08:00 UTC.
    const end = addDuration(new Date("2026-03-28T09:00:00Z"), {
      count: 1,
      unit: "day",
    });
    assert.equal(end.toISOString(), "2026-03-29T08:00:00.000Z");
  });

  it("adds weeks", () => {
    const end = addDuration(new Date("2026-12-07T09:00:00Z"), {
      count: 2,
      unit: "week",
    });
    assert.equal(end.toISOString(), "2026-12-21T09:00:00.000Z");
  });

  it("adds months across the end of the year", () => {
    const end = addDuration(new Date("2026-12-07T09:00:00Z"), {
      count: 1,
      unit: "month",
    });
    assert.equal(end.toISOString(), "2027-01-07T09:00:00.000Z");
  });

  it("stops at the last day of a shorter month", () => {
    // 31 January 10:00 plus a month: 28 February 10:00.
    const end = addDuration(new Date("2027-01-31T09:00:00Z"), {
      count: 1,
      unit: "month",
    });
    assert.equal(end.toISOString(), "2027-02-28T09:00:00.000Z");
  });
});
