"use client";

import { BikePhoto } from "@/components/bike-photo";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { Row } from "@/components/section";
import type { CustomerBooking } from "@/lib/bookings";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { formatDateTime, formatPeriod } from "@/lib/rental-time";

// A customer's booking in a list: opens its card.
export function BookingRow({ booking }: { booking: CustomerBooking }) {
  const t = useT();
  const locale = useLocale();

  // While the bike is with the customer, only the return time matters.
  let dates = formatPeriod(booking.startsAt, booking.endsAt, locale);
  if (booking.status === "active") {
    dates = t("home.until", { date: formatDateTime(booking.endsAt, locale) });
  }

  return (
    <Row
      href={`/bookings/${booking.id}`}
      start={<BikePhoto size="small" url={booking.bike.coverUrl} />}
      title={booking.bike.name}
      subtitle={dates}
      badge={<BookingStatusBadge status={booking.status} />}
    />
  );
}
