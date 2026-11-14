"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/use-t";
import { daysInMonth, isSameDay } from "@/lib/rental-time";
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
  onSelect: (day: CalendarDay) => void;
};

// A month grid to pick a day from, weeks start on Monday.
export function MonthCalendar({
  availableDays,
  firstDay,
  lastDay,
  selectedDay,
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
  onSelect: (day: CalendarDay) => void;
};

function DayButton({ day, isAvailable, isSelected, onSelect }: DayButtonProps) {
  let colors = "text-foreground active:bg-muted";
  if (!isAvailable) {
    colors = "text-muted-foreground/40";
  } else if (isSelected) {
    colors = "bg-primary font-semibold text-primary-foreground";
  }

  return (
    <button
      type="button"
      disabled={!isAvailable}
      aria-pressed={isSelected}
      onClick={() => onSelect(day)}
      className={`mx-auto flex size-10 items-center justify-center rounded-full transition-colors ${colors}`}
    >
      {day.day}
    </button>
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
