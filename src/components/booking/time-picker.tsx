"use client";

import { useState } from "react";
import { Chip } from "@/components/chip";
import { SectionTitle } from "@/components/section";
import type { StartSlot } from "@/lib/booking-slots";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { formatTime, toWallTime } from "@/lib/rental-time";

// Parts of a day, six hours each: 0:00–6:00 is the night, and so on.
const PARTS_OF_DAY: { label: MessageKey; firstHour: number }[] = [
  { label: "book.night", firstHour: 0 },
  { label: "book.morning", firstHour: 6 },
  { label: "book.afternoon", firstHour: 12 },
  { label: "book.evening", firstHour: 18 },
];

// Up to this many start times fit on the screen as they are. More — round the
// clock, every half hour is 48 — are split into parts of the day.
const MAX_TIMES_WITHOUT_PARTS = 12;

function partOfDay(slot: StartSlot): number {
  return Math.floor(toWallTime(slot.startsAt).hour / 6);
}

type TimePickerProps = {
  // The start times of the picked day, in order.
  slots: StartSlot[];
  selectedSlot: StartSlot | null;
  onSelect: (slot: StartSlot) => void;
};

// The start times of one day. A long list is split into tabs by the part of
// the day, so the block stays short.
export function TimePicker({ slots, selectedSlot, onSelect }: TimePickerProps) {
  const t = useT();
  const locale = useLocale();
  // The tab the customer opened; null — none yet, see shownPart below.
  const [chosenPart, setChosenPart] = useState<number | null>(null);

  const isSplit = slots.length > MAX_TIMES_WITHOUT_PARTS;
  const partsWithSlots = PARTS_OF_DAY.map((part, index) => index).filter(
    (index) => slots.some((slot) => partOfDay(slot) === index),
  );

  // The tab the customer opened, while it has times on this day; otherwise
  // the one with the picked time; otherwise the first with a free time.
  let shownPart = partsWithSlots[0] ?? 0;
  const firstFree = slots.find((slot) => !slot.isBusy);
  if (chosenPart !== null && partsWithSlots.includes(chosenPart)) {
    shownPart = chosenPart;
  } else if (selectedSlot !== null) {
    shownPart = partOfDay(selectedSlot);
  } else if (firstFree) {
    shownPart = partOfDay(firstFree);
  }

  let shownSlots = slots;
  if (isSplit) {
    shownSlots = slots.filter((slot) => partOfDay(slot) === shownPart);
  }
  const hasBusySlots = slots.some((slot) => slot.isBusy);

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>{t("book.startTime")}</SectionTitle>

      {isSplit && (
        <div
          role="tablist"
          className="grid gap-1 rounded-xl bg-muted p-1"
          style={{
            gridTemplateColumns: `repeat(${partsWithSlots.length}, minmax(0, 1fr))`,
          }}
        >
          {partsWithSlots.map((index) => (
            <PartTab
              key={index}
              label={t(PARTS_OF_DAY[index].label)}
              isSelected={index === shownPart}
              // A part with nothing free is still opened, but looks quieter.
              hasFreeTimes={slots.some(
                (slot) => partOfDay(slot) === index && !slot.isBusy,
              )}
              onSelect={() => setChosenPart(index)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {shownSlots.map((slot) => (
          <Chip
            key={slot.startsAt.toISOString()}
            label={formatTime(slot.startsAt, locale)}
            isSelected={slot === selectedSlot}
            isDisabled={slot.isBusy}
            onSelect={() => onSelect(slot)}
          />
        ))}
      </div>

      {hasBusySlots && (
        <p className="px-1 text-sm text-muted-foreground">
          {t("book.busyTimeHint")}
        </p>
      )}
    </section>
  );
}

type PartTabProps = {
  label: string;
  isSelected: boolean;
  hasFreeTimes: boolean;
  onSelect: () => void;
};

function PartTab({ label, isSelected, hasFreeTimes, onSelect }: PartTabProps) {
  let colors = "text-muted-foreground";
  if (isSelected) {
    colors = "bg-card text-foreground shadow-sm";
  } else if (hasFreeTimes) {
    colors = "text-foreground";
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={onSelect}
      className={`h-9 rounded-lg px-2 text-sm font-medium transition-colors ${colors}`}
    >
      {label}
    </button>
  );
}
