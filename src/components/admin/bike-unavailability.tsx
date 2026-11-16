"use client";

import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { Field, Select, TextInput } from "@/components/form";
import { FormError } from "@/components/form-error";
import { Row, Section, SectionTitle } from "@/components/section";
import { Switch } from "@/components/switch";
import type { AdminBookingsResponse } from "@/lib/admin-bookings";
import { draftKey } from "@/lib/bike-draft";
import type { DraftPeriod } from "@/lib/bike-draft";
import { overlapsAny } from "@/lib/booking-slots";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useLocale, useT } from "@/lib/i18n/use-t";
import {
  formatPeriod,
  parseCalendarDay,
  toCalendarDay,
  toDateInputValue,
} from "@/lib/rental-time";
import { formatMinuteOfDay, listMinutesOfDay } from "@/lib/settings";
import {
  describePeriod,
  timedPeriod,
  wholeDaysPeriod,
} from "@/lib/unavailable";
import type { NewUnavailablePeriod } from "@/lib/unavailable";
import { useApi } from "@/lib/use-api";

type BikeUnavailabilityProps = {
  bikeId: string;
  periods: DraftPeriod[];
  onPeriodsChange: (periods: DraftPeriod[]) => void;
  // "Temporarily unavailable".
  isPaused: boolean;
  onPausedChange: (isPaused: boolean) => void;
};

// "Unavailable" on the bike's page: the times the admin closes the bike for
// (repair and the like) and the "temporarily unavailable" switch. Changes
// stay in the page's draft until "Save".
export function BikeUnavailability({
  bikeId,
  periods,
  onPeriodsChange,
  isPaused,
  onPausedChange,
}: BikeUnavailabilityProps) {
  const t = useT();
  const locale = useLocale();
  const [isAdding, setIsAdding] = useState(false);

  function addPeriod(period: NewUnavailablePeriod) {
    const newPeriod: DraftPeriod = {
      kind: "new",
      key: crypto.randomUUID(),
      ...period,
    };
    // Keep the list in time order, like the saved one.
    const sorted = [...periods, newPeriod].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
    onPeriodsChange(sorted);
    setIsAdding(false);
  }

  function removePeriod(key: string) {
    onPeriodsChange(periods.filter((period) => draftKey(period) !== key));
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>{t("unavailable.title")}</SectionTitle>

      {periods.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">
          {t("unavailable.empty")}
        </p>
      ) : (
        <Section>
          {periods.map((period) => {
            const label = describePeriod(period, locale);
            let subtitle: string | undefined;
            if (label.isWholeDays) {
              subtitle = t("unavailable.wholeDays");
            }
            return (
              <Row
                key={draftKey(period)}
                icon={CalendarOff}
                title={label.text}
                subtitle={subtitle}
                end={
                  <button
                    type="button"
                    aria-label={t("unavailable.delete")}
                    onClick={() => removePeriod(draftKey(period))}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-muted"
                  >
                    <Trash2 className="size-[18px]" />
                  </button>
                }
              />
            );
          })}
        </Section>
      )}

      {isAdding ? (
        <PeriodForm
          bikeId={bikeId}
          onAdd={addPeriod}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <Button variant="secondary" onClick={() => setIsAdding(true)}>
          <Plus />
          {t("unavailable.add")}
        </Button>
      )}

      <Switch
        label={t("pause.title")}
        description={t("pause.hint")}
        isOn={isPaused}
        onChange={onPausedChange}
      />
    </section>
  );
}

type PeriodFormProps = {
  bikeId: string;
  onAdd: (period: NewUnavailablePeriod) => void;
  onCancel: () => void;
};

// A new period, right under the list: the days and, if the switch is on,
// the times of day. "Add" puts it into the draft.
function PeriodForm({ bikeId, onAdd, onCancel }: PeriodFormProps) {
  const t = useT();

  // Today in Warsaw: the earliest day a period can start on.
  const [today] = useState(() => toDateInputValue(toCalendarDay(new Date())));
  // The values of <input type="date">: "2026-12-31", or "" when not set.
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const [hasTime, setHasTime] = useState(false);
  // Minutes from midnight: 540 is 9:00.
  const [startMinute, setStartMinute] = useState(9 * 60);
  const [endMinute, setEndMinute] = useState(18 * 60);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  // The period the fields describe, or null while they don't make one yet.
  let period: NewUnavailablePeriod | null = null;
  const firstDay = parseCalendarDay(fromDay);
  const lastDay = parseCalendarDay(toDay);
  if (firstDay !== null && lastDay !== null) {
    if (hasTime) {
      period = timedPeriod(firstDay, startMinute, lastDay, endMinute);
    } else {
      period = wholeDaysPeriod(firstDay, lastDay);
    }
    // "To" before "from", or the same day with the end time before the start.
    if (new Date(period.endsAt) <= new Date(period.startsAt)) {
      period = null;
    }
  }

  // "From" can't be in the past, and "to" can't be before "from": when the
  // new "from" is later, "to" moves along. iPhone fills the field with today
  // the moment its picker opens, so "to" got today and stayed behind.
  function changeFromDay(value: string) {
    setFromDay(value);
    if (toDay === "" || toDay < value) {
      setToDay(value);
    }
  }

  function add() {
    if (firstDay === null || lastDay === null) {
      setErrorKey("unavailable.datesRequired");
      return;
    }
    // The picker may not grey out past days on every phone: check here too.
    if (fromDay < today) {
      setErrorKey("unavailable.pastDate");
      return;
    }
    if (period === null) {
      setErrorKey("unavailable.endBeforeStart");
      return;
    }
    // Today with times that are already over.
    if (new Date(period.endsAt) <= new Date()) {
      setErrorKey("unavailable.pastDate");
      return;
    }
    onAdd(period);
  }

  const minutes = listMinutesOfDay();

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("unavailable.from")}>
          <TextInput
            type="date"
            value={fromDay}
            min={today}
            onChange={(event) => changeFromDay(event.target.value)}
          />
        </Field>
        <Field label={t("unavailable.to")}>
          <TextInput
            type="date"
            value={toDay}
            min={fromDay === "" ? today : fromDay}
            onChange={(event) => setToDay(event.target.value)}
          />
        </Field>
      </div>

      <Switch
        label={t("unavailable.withTime")}
        description={t("unavailable.withTimeHint")}
        isOn={hasTime}
        onChange={setHasTime}
      />

      {hasTime && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("unavailable.startTime")}>
            <Select
              value={startMinute}
              onChange={(event) => setStartMinute(Number(event.target.value))}
            >
              {minutes.map((minute) => (
                <option key={minute} value={minute}>
                  {formatMinuteOfDay(minute)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("unavailable.endTime")}>
            <Select
              value={endMinute}
              onChange={(event) => setEndMinute(Number(event.target.value))}
            >
              {minutes.map((minute) => (
                <option key={minute} value={minute}>
                  {formatMinuteOfDay(minute)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {period !== null && (
        <BookingsInPeriod
          bikeId={bikeId}
          fromDay={fromDay}
          toDay={toDay}
          period={period}
        />
      )}

      {errorKey !== null && <FormError>{t(errorKey)}</FormError>}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" size="small" onClick={onCancel}>
          {t("adminBooking.back")}
        </Button>
        <Button size="small" onClick={add}>
          {t("unavailable.addToList")}
        </Button>
      </div>
    </div>
  );
}

type BookingsInPeriodProps = {
  bikeId: string;
  fromDay: string;
  toDay: string;
  period: NewUnavailablePeriod;
};

// A warning: bookings of this bike that fall into the period. The period
// can still be added; what to do with those bookings is the admin's call.
function BookingsInPeriod({
  bikeId,
  fromDay,
  toDay,
  period,
}: BookingsInPeriodProps) {
  const t = useT();
  const locale = useLocale();

  const params = new URLSearchParams({
    status: "all",
    bikeId,
    from: fromDay,
    to: toDay,
  });
  const { data } = useApi<AdminBookingsResponse>(
    `/api/admin/bookings?${params.toString()}`,
  );
  if (!data) {
    return null;
  }

  // The API filters by whole days; here the exact times are compared,
  // and only the bookings that are still going on count.
  const clashing = data.bookings.filter((booking) => {
    const isOpen =
      booking.status === "pending" ||
      booking.status === "confirmed" ||
      booking.status === "active";
    return (
      isOpen &&
      overlapsAny(new Date(booking.startsAt), new Date(booking.endsAt), [
        period,
      ])
    );
  });
  if (clashing.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-500/40 p-3">
      <span className="font-semibold">{t("unavailable.clashTitle")}</span>
      {clashing.map((booking) => (
        <span
          key={booking.id}
          className="text-sm text-muted-foreground wrap-anywhere"
        >
          {booking.customer.fullName} ·{" "}
          {formatPeriod(booking.startsAt, booking.endsAt, locale)} ·{" "}
          {t(`status.${booking.status}`)}
        </span>
      ))}
      <span className="text-sm text-muted-foreground">
        {t("unavailable.clashHint")}
      </span>
    </div>
  );
}
