"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UIEvent } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { Chip } from "@/components/chip";
import { SectionTitle } from "@/components/section";
import type { StartSlot } from "@/lib/booking-slots";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { formatTime, toWallTime } from "@/lib/rental-time";

// Up to this many start times fit on the screen as they are. More — round the
// clock, every half hour is 48 — are split into pages of six hours each,
// swiped sideways.
const MAX_TIMES_ON_ONE_PAGE = 12;
const HOURS_PER_PAGE = 6;

type TimePickerProps = {
  // The start times of the picked day, in order.
  slots: StartSlot[];
  selectedSlot: StartSlot | null;
  onSelect: (slot: StartSlot) => void;
};

// The start times of one day. A long list becomes pages of six hours that are
// swiped sideways (or turned with the arrows), so the block stays short.
// The page shows the picked time, otherwise the first free one.
// Give it a new `key` when the day changes, so it opens on the right page.
export function TimePicker({ slots, selectedSlot, onSelect }: TimePickerProps) {
  const t = useT();
  const locale = useLocale();
  const strip = useRef<HTMLDivElement>(null);

  const pages = splitIntoPages(slots);
  const [currentPage, setCurrentPage] = useState(() =>
    findStartPage(pages, selectedSlot),
  );

  // Open on the start page at once, before the first paint: no visible jump.
  useLayoutEffect(() => {
    const element = strip.current;
    if (element) {
      element.scrollLeft = currentPage * element.clientWidth;
    }
    // Only on the first render: afterwards the customer scrolls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    setCurrentPage(Math.round(element.scrollLeft / element.clientWidth));
  }

  function turnPage(step: -1 | 1) {
    const element = strip.current;
    if (!element) {
      return;
    }
    element.scrollTo({
      left: (currentPage + step) * element.clientWidth,
      behavior: "smooth",
    });
  }

  const hasBusySlots = slots.some((slot) => slot.isBusy);
  const isPaged = pages.length > 1;
  const shownPage = pages[currentPage] ?? pages[0] ?? [];

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>{t("book.startTime")}</SectionTitle>

      {isPaged && (
        <div className="flex items-center justify-between gap-3">
          <PageButton
            direction="previous"
            isShown={currentPage > 0}
            onClick={() => turnPage(-1)}
          />
          {/* Which hours this page holds: "06:00 – 11:30". */}
          <span className="text-sm font-medium tabular-nums">
            {formatTime(shownPage[0].startsAt, locale)} –{" "}
            {formatTime(shownPage[shownPage.length - 1].startsAt, locale)}
          </span>
          <PageButton
            direction="next"
            isShown={currentPage < pages.length - 1}
            onClick={() => turnPage(1)}
          />
        </div>
      )}

      {/* Every page is as wide as the block, and the strip snaps to pages.
          items-start: a page with fewer times doesn't stretch. */}
      <div
        ref={strip}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory items-start overflow-x-auto [scrollbar-width:none]"
      >
        {pages.map((page) => (
          <div
            key={page[0].startsAt.toISOString()}
            className="flex w-full shrink-0 snap-start flex-wrap gap-2"
          >
            {page.map((slot) => (
              <Chip
                key={slot.startsAt.toISOString()}
                label={formatTime(slot.startsAt, locale)}
                isSelected={slot === selectedSlot}
                isDisabled={slot.isBusy}
                onSelect={() => onSelect(slot)}
              />
            ))}
          </div>
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

// All times on one page when they fit; otherwise a page per six hours of the
// day (0:00–5:30, 6:00–11:30…), leaving out the hours without times.
function splitIntoPages(slots: StartSlot[]): StartSlot[][] {
  if (slots.length <= MAX_TIMES_ON_ONE_PAGE) {
    return [slots];
  }

  const pages: StartSlot[][] = [];
  let currentPart = -1;
  for (const slot of slots) {
    const part = Math.floor(toWallTime(slot.startsAt).hour / HOURS_PER_PAGE);
    if (part !== currentPart) {
      pages.push([]);
      currentPart = part;
    }
    pages[pages.length - 1].push(slot);
  }
  return pages;
}

// The page with the picked time, otherwise with the first free one.
function findStartPage(
  pages: StartSlot[][],
  selectedSlot: StartSlot | null,
): number {
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    if (selectedSlot !== null && page.includes(selectedSlot)) {
      return index;
    }
  }
  for (let index = 0; index < pages.length; index++) {
    if (pages[index].some((slot) => !slot.isBusy)) {
      return index;
    }
  }
  return 0;
}

type PageButtonProps = {
  direction: "previous" | "next";
  // False on the first or the last page: there is nothing that way.
  isShown: boolean;
  onClick: () => void;
};

function PageButton({ direction, isShown, onClick }: PageButtonProps) {
  const t = useT();
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  const label =
    direction === "previous" ? t("book.earlierTimes") : t("book.laterTimes");

  // Hidden, not removed: the other arrow and the hours stay where they are.
  return (
    <button
      type="button"
      aria-label={label}
      aria-hidden={!isShown}
      tabIndex={isShown ? 0 : -1}
      onClick={onClick}
      className={`flex size-9 items-center justify-center rounded-full bg-muted transition-opacity active:opacity-70 ${isShown ? "" : "invisible"}`}
    >
      <Icon className="size-5" />
    </button>
  );
}
