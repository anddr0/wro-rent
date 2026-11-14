"use client";

import { useParams } from "next/navigation";
import { BookingDetailsForm } from "@/components/admin/booking-details-form";
import { ErrorState } from "@/components/error-state";
import { NotFoundText } from "@/components/not-found-text";
import { Skeleton } from "@/components/skeleton";
import type { AdminBookingResponse } from "@/lib/admin-bookings";
import { useT } from "@/lib/i18n/use-t";
import { isNotFound, useApi } from "@/lib/use-api";

// Price, payment and the admin's note of a booking (А-7).
export default function EditAdminBookingPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  // Same path as the booking card, so coming from there it's already loaded.
  const { data, error, mutate } = useApi<AdminBookingResponse>(
    `/api/admin/bookings/${id}`,
  );

  if (isNotFound(error)) {
    return <NotFoundText>{t("common.bookingNotFound")}</NotFoundText>;
  }
  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  return <BookingDetailsForm booking={data.booking} />;
}
