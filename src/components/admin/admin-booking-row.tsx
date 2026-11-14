"use client";

import { BookingStatusBadge } from "@/components/booking-status-badge";
import { Row } from "@/components/section";
import type { AdminBooking } from "@/lib/admin-bookings";
import { useLocale } from "@/lib/i18n/use-t";
import { formatPeriod } from "@/lib/rental-time";

// A booking in the admin's lists: opens its card.
export function AdminBookingRow({ booking }: { booking: AdminBooking }) {
  const locale = useLocale();

  return (
    <Row
      href={`/admin/bookings/${booking.id}`}
      title={booking.bike.name}
      subtitle={
        <>
          {booking.customer.fullName}
          <br />
          {formatPeriod(booking.startsAt, booking.endsAt, locale)}
        </>
      }
      badge={<BookingStatusBadge status={booking.status} />}
    />
  );
}
