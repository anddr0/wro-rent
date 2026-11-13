"use client";

import { History } from "lucide-react";
import { BikePhoto } from "@/components/bike-photo";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";
import { DEMO_BOOKINGS, isCurrentBooking } from "@/lib/demo-data";
import { useT } from "@/lib/i18n/use-t";

export default function HistoryPage() {
  const t = useT();
  // TODO(slice 3.1): the user's past bookings from the API.
  const pastBookings = DEMO_BOOKINGS.filter(
    (booking) => !isCurrentBooking(booking),
  );

  return (
    <>
      <PageTitle>{t("history.title")}</PageTitle>
      {pastBookings.length === 0 ? (
        <EmptyState icon={History} title={t("history.empty")} />
      ) : (
        <Section>
          {pastBookings.map((booking) => (
            <Row
              key={booking.id}
              href={`/bookings/${booking.id}`}
              start={<BikePhoto size="small" />}
              title={booking.bikeName}
              subtitle={`${booking.startsAt} → ${booking.endsAt}`}
              badge={<BookingStatusBadge status={booking.status} />}
            />
          ))}
        </Section>
      )}
    </>
  );
}
