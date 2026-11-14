"use client";

import { History } from "lucide-react";
import { BookingRow } from "@/components/booking/booking-row";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageTitle } from "@/components/page-title";
import { Section } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import { isOpenStatus } from "@/lib/bookings";
import type { BookingsResponse } from "@/lib/bookings";
import { useT } from "@/lib/i18n/use-t";
import { useApi } from "@/lib/use-api";

export default function HistoryPage() {
  const t = useT();

  return (
    <>
      <PageTitle>{t("history.title")}</PageTitle>
      <PastBookings />
    </>
  );
}

// Finished, cancelled and rejected bookings (К-6).
function PastBookings() {
  const t = useT();
  // Same path as the home page, so coming from there it's already loaded.
  const { data, error, mutate } = useApi<BookingsResponse>("/api/bookings");

  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return <Skeleton className="h-40 rounded-xl" />;
  }

  const pastBookings = data.bookings.filter(
    (booking) => !isOpenStatus(booking.status),
  );
  if (pastBookings.length === 0) {
    return <EmptyState icon={History} title={t("history.empty")} />;
  }

  return (
    <Section>
      {pastBookings.map((booking) => (
        <BookingRow key={booking.id} booking={booking} />
      ))}
    </Section>
  );
}
