"use client";

import { useParams } from "next/navigation";
import { BookingForm } from "@/components/booking/booking-form";
import { ButtonLink } from "@/components/button";
import { ErrorState } from "@/components/error-state";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { Skeleton } from "@/components/skeleton";
import { BOOKING_RULES } from "@/lib/booking-rules";
import { isOpenStatus } from "@/lib/bookings";
import type { AvailabilityResponse, BookingsResponse } from "@/lib/bookings";
import type { BikeResponse } from "@/lib/catalog";
import { useT } from "@/lib/i18n/use-t";
import { isNotFound, useApi } from "@/lib/use-api";

export default function BookPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  // Same path as the bike page, so coming from there it's already loaded.
  const bike = useApi<BikeResponse>(`/api/bikes/${id}`);
  const availability = useApi<AvailabilityResponse>(
    `/api/bikes/${id}/availability`,
  );
  // Same path as the home page, so usually it's already loaded.
  const bookings = useApi<BookingsResponse>("/api/bookings");

  if (isNotFound(bike.error) || isNotFound(availability.error)) {
    return <NotFoundText>{t("common.bikeNotFound")}</NotFoundText>;
  }
  if (
    (bike.error && !bike.data) ||
    (availability.error && !availability.data)
  ) {
    return (
      <ErrorState
        onRetry={() => {
          bike.mutate();
          availability.mutate();
        }}
      />
    );
  }
  if (!bike.data || !availability.data) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  // Say it before the customer fills the form in, not after "Send".
  // While the bookings load (or if they failed) the form is shown:
  // the server checks the limit anyway.
  const openBookingsCount = countOpenBookings(bookings.data);
  if (openBookingsCount >= BOOKING_RULES.maxOpenBookingsPerCustomer) {
    return (
      <>
        <PageTitle>{bike.data.bike.name}</PageTitle>
        <div className="flex flex-col gap-1 rounded-xl border border-amber-500/40 bg-card p-4">
          <span className="font-semibold">
            {t("book.limitTitle", { count: openBookingsCount })}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("book.limitHint")}
          </span>
        </div>
        <ButtonLink href="/" variant="secondary">
          {t("home.myBookings")}
        </ButtonLink>
      </>
    );
  }
  if (bike.data.bike.isPaused) {
    return <NotFoundText>{t("pause.customerNote")}</NotFoundText>;
  }
  if (bike.data.plans.length === 0) {
    return <NotFoundText>{t("book.noPlans")}</NotFoundText>;
  }

  return (
    <BookingForm
      bike={bike.data.bike}
      plans={bike.data.plans}
      availability={availability.data}
      onAvailabilityOutdated={() => availability.mutate()}
    />
  );
}

// How many requests and rentals of the customer are still going on.
function countOpenBookings(bookings: BookingsResponse | undefined): number {
  if (!bookings) {
    return 0;
  }
  let count = 0;
  for (const booking of bookings.bookings) {
    if (isOpenStatus(booking.status)) {
      count += 1;
    }
  }
  return count;
}
