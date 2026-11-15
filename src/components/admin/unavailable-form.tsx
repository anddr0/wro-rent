"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { Field, Select, TextInput } from "@/components/form";
import { FormError } from "@/components/form-error";
import { Switch } from "@/components/switch";
import type { AdminBookingsResponse } from "@/lib/admin-bookings";
import { apiSendJson } from "@/lib/api";
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
import { timedPeriod, wholeDaysPeriod } from "@/lib/unavailable";
import type { NewUnavailablePeriod } from "@/lib/unavailable";
import { refreshApi, useApi } from "@/lib/use-api";

// "Add a period": the days the bike is unavailable on and, if the switch
// is on, the times of day.
export function UnavailableForm({ bikeId }: { bikeId: string }) {
  const t = useT();
  const router = useRouter();

  // Today in Warsaw: the earliest day a period can start on.
  const [today] = useState(() => toDateInputValue(toCalendarDay(new Date())));
  // The values of <input type="date">: "2026-12-31", or "" when not set.
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const [hasTime, setHasTime] = useState(false);
  // Minutes from midnight: 540 is 9:00.
  const [startMinute, setStartMinute] = useState(9 * 60);
  const [endMinute, setEndMinute] = useState(18 * 60);
  const [isSaving, setIsSaving] = useState(false);
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

  async function save() {
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

    setIsSaving(true);
    setErrorKey(null);
    try {
      await apiSendJson(
        "POST",
        `/api/admin/bikes/${bikeId}/unavailable`,
        period,
      );
      // The list on the bike's page and the calendar customers see.
      await refreshApi(`/api/admin/bikes/${bikeId}/unavailable`);
      await refreshApi(`/api/bikes/${bikeId}`);
      router.back();
    } catch (error) {
      console.error(error);
      setErrorKey("common.saveFailed");
    } finally {
      setIsSaving(false);
    }
  }

  const minutes = listMinutesOfDay();

  return (
    <>
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

      <BottomBar>
        {errorKey !== null && <FormError>{t(errorKey)}</FormError>}
        <Button onClick={save} disabled={isSaving}>
          {t("common.save")}
        </Button>
      </BottomBar>
    </>
  );
}

type BookingsInPeriodProps = {
  bikeId: string;
  fromDay: string;
  toDay: string;
  period: NewUnavailablePeriod;
};

// A warning: bookings of this bike that fall into the period. The period
// can still be saved; what to do with those bookings is the admin's call.
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
    <div className="flex flex-col gap-2 rounded-xl border border-amber-500/40 bg-card p-4">
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
