"use client";

import { useParams } from "next/navigation";
import { BookingForm } from "@/components/booking/booking-form";
import { ErrorState } from "@/components/error-state";
import { NotFoundText } from "@/components/not-found-text";
import { Skeleton } from "@/components/skeleton";
import type { AvailabilityResponse } from "@/lib/bookings";
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
