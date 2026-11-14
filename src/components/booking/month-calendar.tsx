"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/use-t";
import { daysInMonth, isDayBefore, isSameDay } from "@/lib/rental-time";
import type { CalendarDay } from "@/lib/rental-time";

type Month = { year: number; month: number };

type MonthCalendarProps = {
  // The days that can be picked, in order. The calendar shows the months
  // they fall into; every other day is greyed out.
  availableDays: CalendarDay[];
  // The first and the last month to show.
  firstDay: CalendarDay;
  lastDay: CalendarDay;
  selectedDay: CalendarDay | null;
  // The day the rental ends. The days from the selected one to this one are
  // tinted, so the customer sees how long the bike is theirs. Null — no tint.
  rangeEndDay: CalendarDay | null;
  onSelect: (day: CalendarDay) => void;
};

// Where a day is in the tinted range of the rental.
type RangePart = "none" | "start" | "middle" | "end";

// A month grid to pick a day from, weeks start on Monday.
export function MonthCalendar({
  availableDays,
  firstDay,
  lastDay,
  selectedDay,
  rangeEndDay,
  onSelect,
}: MonthCalendarProps) {
  const locale = useLocale();
  const [shownMonth, setShownMonth] = useState<Month>(() => {
    const startDay = selectedDay ?? firstDay;
    return { year: startDay.year, month: startDay.month };
  });

  const hasPreviousMonth = isMonthAfter(shownMonth, firstDay);
  const hasNextMonth = isMonthAfter(lastDay, shownMonth);

  function showPreviousMonth() {
    if (shownMonth.month === 1) {
      setShownMonth({ year: shownMonth.year - 1, month: 12 });
    } else {
      setShownMonth({ year: shownMonth.year, month: shownMonth.month - 1 });
    }
  }

  function showNextMonth() {
    if (shownMonth.month === 12) {
      setShownMonth({ year: shownMonth.year + 1, month: 1 });
    } else {
      setShownMonth({ year: shownMonth.year, month: shownMonth.month + 1 });
    }
  }

  function rangePartOf(day: CalendarDay): RangePart {
    // A rental that ends on the day it starts has no range to show.
    if (
      selectedDay === null ||
      rangeEndDay === null ||
      isSameDay(selectedDay, rangeEndDay)
    ) {
      return "none";
    }
    if (isSameDay(day, selectedDay)) {
      return "start";
    }
    if (isSameDay(day, rangeEndDay)) {
      return "end";
    }
    if (isDayBefore(selectedDay, day) && isDayBefore(day, rangeEndDay)) {
      return "middle";
    }
    return "none";
  }

  const dayCount = daysInMonth(shownMonth.year, shownMonth.month);
  const days: CalendarDay[] = [];
  for (let day = 1; day <= dayCount; day++) {
    days.push({ year: shownMonth.year, month: shownMonth.month, day });
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <MonthButton
          icon={ChevronLeft}
          isEnabled={hasPreviousMonth}
          onClick={showPreviousMonth}
        />
        <span className="font-medium first-letter:uppercase">
          {formatMonth(shownMonth, locale)}
        </span>
        <MonthButton
          icon={ChevronRight}
          isEnabled={hasNextMonth}
          onClick={showNextMonth}
        />
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {weekdayNames(locale).map((name) => (
          <span key={name} className="pb-1 text-xs text-muted-foreground">
            {name}
          </span>
        ))}

        {/* Empty cells before the 1st, so it lands on its day of the week. */}
        {emptyCells(mondayBasedWeekday(days[0])).map((index) => (
          <span key={`empty-${index}`} />
        ))}

        {days.map((day) => (
          <DayButton
            key={day.day}
            day={day}
            isAvailable={availableDays.some((item) => isSameDay(item, day))}
            isSelected={selectedDay !== null && isSameDay(selectedDay, day)}
            rangePart={rangePartOf(day)}
            isRowStart={day.day === 1 || mondayBasedWeekday(day) === 0}
            isRowEnd={day.day === dayCount || mondayBasedWeekday(day) === 6}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

type DayButtonProps = {
  day: CalendarDay;
  isAvailable: boolean;
  isSelected: boolean;
  rangePart: RangePart;
  // The first or the last day of its row in the grid: the band of the
  // rental is rounded there, it continues on the next row.
  isRowStart: boolean;
  isRowEnd: boolean;
  onSelect: (day: CalendarDay) => void;
};

// The band is as tall as a day's circle (size-10, 2.5rem). Where it begins
// or ends it is rounded and hugs the circle of that day instead of filling
// the whole cell, so the band looks like one long pill around the days.
const BAND_LEFT_CAP = "left-[calc(50%-1.25rem)] rounded-l-full";
const BAND_RIGHT_CAP = "right-[calc(50%-1.25rem)] rounded-r-full";

function DayButton({
  day,
  isAvailable,
  isSelected,
  rangePart,
  isRowStart,
  isRowEnd,
  onSelect,
}: DayButtonProps) {
  let colors = "text-foreground active:bg-muted";
  if (isSelected) {
    colors = "bg-primary font-semibold text-primary-foreground";
  } else if (rangePart === "end") {
    colors = "font-semibold text-foreground";
  } else if (!isAvailable && rangePart === "none") {
    colors = "text-muted-foreground/40";
  }

  let bandLeft = "left-0";
  if (rangePart === "start" || isRowStart) {
    bandLeft = BAND_LEFT_CAP;
  }
  let bandRight = "right-0";
  if (rangePart === "end" || isRowEnd) {
    bandRight = BAND_RIGHT_CAP;
  }

  return (
    <div className="relative flex justify-center">
      {rangePart !== "none" && (
        <span
          aria-hidden
          className={`absolute inset-y-0 bg-muted-foreground/20 ${bandLeft} ${bandRight}`}
        />
      )}
      <button
        type="button"
        disabled={!isAvailable}
        aria-pressed={isSelected}
        onClick={() => onSelect(day)}
        className={`relative flex size-10 items-center justify-center rounded-full transition-colors ${colors}`}
      >
        {day.day}
      </button>
    </div>
  );
}

type MonthButtonProps = {
  icon: typeof ChevronLeft;
  isEnabled: boolean;
  onClick: () => void;
};

function MonthButton({ icon: Icon, isEnabled, onClick }: MonthButtonProps) {
  return (
    <button
      type="button"
      disabled={!isEnabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full bg-muted transition-opacity active:opacity-70 disabled:opacity-30"
    >
      <Icon className="size-5" />
    </button>
  );
}

// Is the month of `a` later than the month of `b`?
function isMonthAfter(a: Month, b: Month): boolean {
  if (a.year !== b.year) {
    return a.year > b.year;
  }
  return a.month > b.month;
}

// 0 for Monday … 6 for Sunday.
function mondayBasedWeekday(day: CalendarDay): number {
  // A calendar date has the same day of the week everywhere, so UTC is fine.
  const sundayBased = new Date(
    Date.UTC(day.year, day.month - 1, day.day),
  ).getUTCDay();
  return (sundayBased + 6) % 7;
}

function emptyCells(count: number): number[] {
  const cells: number[] = [];
  for (let index = 0; index < count; index++) {
    cells.push(index);
  }
  return cells;
}

// "декабрь 2026"
function formatMonth(month: Month, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(month.year, month.month - 1, 1)));
}

// "пн", "вт", … starting from Monday.
function weekdayNames(locale: string): string[] {
  const format = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "short",
  });
  const names: string[] = [];
  for (let index = 0; index < 7; index++) {
    // 1 January 2024 was a Monday.
    names.push(format.format(new Date(Date.UTC(2024, 0, 1 + index))));
  }
  return names;
}
