"use client";

import { CalendarDays, Inbox } from "lucide-react";
import { useState } from "react";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { Chip } from "@/components/chip";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";
import type { Enums } from "@/lib/database.types";
import { DEMO_BOOKINGS } from "@/lib/demo-data";

type StatusFilter = Enums<"booking_status"> | "all";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Ожидают" },
  { value: "confirmed", label: "Подтверждены" },
  { value: "active", label: "У клиентов" },
  { value: "all", label: "Все" },
];

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState<StatusFilter>("pending");

  // TODO(slice 4.1): filtered bookings from the API, newest first.
  let bookings = DEMO_BOOKINGS;
  if (filter !== "all") {
    bookings = DEMO_BOOKINGS.filter((booking) => booking.status === filter);
  }

  return (
    <>
      <PageTitle description="Новые заявки — сверху">Брони</PageTitle>

      {/* Scrolls sideways instead of wrapping, so the list stays in place. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        {FILTERS.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            isSelected={item.value === filter}
            onSelect={() => setFilter(item.value)}
          />
        ))}
        {/* TODO(slice 4.1): filter by dates. */}
        <Chip
          icon={CalendarDays}
          label="Любые даты"
          isSelected={false}
          onSelect={() => {}}
        />
      </div>

      {bookings.length === 0 ? (
        <EmptyState icon={Inbox} title="Здесь пусто" />
      ) : (
        <Section>
          {bookings.map((booking) => (
            <Row
              key={booking.id}
              href={`/admin/bookings/${booking.id}`}
              title={booking.bikeName}
              subtitle={
                <>
                  {booking.customerName}
                  <br />
                  {booking.startsAt} → {booking.endsAt}
                </>
              }
              badge={<BookingStatusBadge status={booking.status} />}
            />
          ))}
        </Section>
      )}
    </>
  );
}
