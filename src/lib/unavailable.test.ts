import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { describePeriod, timedPeriod, wholeDaysPeriod } from "./unavailable";

// Winter time: Warsaw is one hour ahead of UTC.
const NOV_20 = { year: 2026, month: 11, day: 20 };
const NOV_24 = { year: 2026, month: 11, day: 24 };

describe("wholeDaysPeriod", () => {
  it("runs from the first midnight to the midnight after the last day", () => {
    assert.deepEqual(wholeDaysPeriod(NOV_20, NOV_24), {
      startsAt: "2026-11-19T23:00:00.000Z",
      endsAt: "2026-11-24T23:00:00.000Z",
    });
  });

  it("covers one whole day when both days are the same", () => {
    assert.deepEqual(wholeDaysPeriod(NOV_20, NOV_20), {
      startsAt: "2026-11-19T23:00:00.000Z",
      endsAt: "2026-11-20T23:00:00.000Z",
    });
  });
});

describe("timedPeriod", () => {
  it("uses the given times of day", () => {
    // 9:00 to 14:00 on 20 November.
    assert.deepEqual(timedPeriod(NOV_20, 540, NOV_20, 840), {
      startsAt: "2026-11-20T08:00:00.000Z",
      endsAt: "2026-11-20T13:00:00.000Z",
    });
  });
});

describe("describePeriod", () => {
  it("shows whole days as dates only, the last day included", () => {
    const label = describePeriod(wholeDaysPeriod(NOV_20, NOV_24), "en");
    assert.equal(label.isWholeDays, true);
    assert.equal(label.text, "Nov 20 – Nov 24");
  });

  it("shows a single whole day as one date", () => {
    const label = describePeriod(wholeDaysPeriod(NOV_20, NOV_20), "en");
    assert.equal(label.text, "Nov 20");
  });

  it("shows the times when the period isn't whole days", () => {
    const label = describePeriod(timedPeriod(NOV_20, 540, NOV_20, 840), "en");
    assert.equal(label.isWholeDays, false);
    assert.equal(label.text, "Nov 20, 09:00 AM – 02:00 PM");
  });
});
