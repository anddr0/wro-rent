"use client";

import { CalendarDays, Inbox } from "lucide-react";
import { useState } from "react";
import { AdminBookingRow } from "@/components/admin/admin-booking-row";
import { Chip } from "@/components/chip";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Field, TextInput } from "@/components/form";
import { PageTitle } from "@/components/page-title";
import { Section } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import type {
  AdminBookingsResponse,
  BookingStatusFilter,
} from "@/lib/admin-bookings";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";
import { useApi } from "@/lib/use-api";

const FILTERS: { value: BookingStatusFilter; label: MessageKey }[] = [
  { value: "pending", label: "adminBookings.filterPending" },
  { value: "confirmed", label: "adminBookings.filterConfirmed" },
  { value: "active", label: "adminBookings.filterActive" },
  { value: "all", label: "adminBookings.filterAll" },
];

export default function AdminBookingsPage() {
  const t = useT();
  const [status, setStatus] = useState<BookingStatusFilter>("pending");
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  // The values of <input type="date">: "2026-12-31", or "" when not set.
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");

  const hasDates = fromDay !== "" || toDay !== "";

  function toggleDateFilter() {
    if (isDateFilterOpen) {
      // Closing the filter also clears it: hidden dates would confuse.
      setFromDay("");
      setToDay("");
    }
    setIsDateFilterOpen(!isDateFilterOpen);
  }

  return (
    <>
      <PageTitle description={t("adminBookings.newestFirst")}>
        {t("adminBookings.title")}
      </PageTitle>

      {/* Scrolls sideways instead of wrapping, so the list stays in place. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        {FILTERS.map((item) => (
          <Chip
            key={item.value}
            label={t(item.label)}
            isSelected={item.value === status}
            onSelect={() => setStatus(item.value)}
          />
        ))}
        <Chip
          icon={CalendarDays}
          label={
            hasDates ? t("adminBookings.byDates") : t("adminBookings.anyDates")
          }
          isSelected={isDateFilterOpen}
          onSelect={toggleDateFilter}
        />
      </div>

      {isDateFilterOpen && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("adminBookings.from")}>
            <TextInput
              type="date"
              value={fromDay}
              max={toDay}
              onChange={(event) => setFromDay(event.target.value)}
            />
          </Field>
          <Field label={t("adminBookings.to")}>
            <TextInput
              type="date"
              value={toDay}
              min={fromDay}
              onChange={(event) => setToDay(event.target.value)}
            />
          </Field>
        </div>
      )}

      <BookingList status={status} fromDay={fromDay} toDay={toDay} />
    </>
  );
}

type BookingListProps = {
  status: BookingStatusFilter;
  fromDay: string;
  toDay: string;
};

function BookingList({ status, fromDay, toDay }: BookingListProps) {
  const t = useT();

  const params = new URLSearchParams({ status });
  if (fromDay !== "") {
    params.set("from", fromDay);
  }
  if (toDay !== "") {
    params.set("to", toDay);
  }
  const { data, error, mutate } = useApi<AdminBookingsResponse>(
    `/api/admin/bookings?${params.toString()}`,
  );

  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return <Skeleton className="h-40 rounded-xl" />;
  }
  if (data.bookings.length === 0) {
    return <EmptyState icon={Inbox} title={t("adminBookings.empty")} />;
  }

  return (
    <Section>
      {data.bookings.map((booking) => (
        <AdminBookingRow key={booking.id} booking={booking} />
      ))}
    </Section>
  );
}
