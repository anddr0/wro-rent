"use client";

import { Check } from "lucide-react";
import { useParams } from "next/navigation";
import { BookingSteps } from "@/components/booking/booking-steps";
import { ButtonLink } from "@/components/button";
import { ErrorState } from "@/components/error-state";
import { NotFoundText } from "@/components/not-found-text";
import { DetailRow, Section } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import type { BookingResponse } from "@/lib/bookings";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { formatPeriod } from "@/lib/rental-time";
import { isNotFound, useApi } from "@/lib/use-api";

export default function BookingSentPage() {
  const t = useT();
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const { data, error, mutate } = useApi<BookingResponse>(
    `/api/bookings/${id}`,
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

  const { booking } = data;

  return (
    <>
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-8" strokeWidth={2.5} />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("sent.title")}
        </h1>
        <p className="text-muted-foreground">{t("sent.thanks")}</p>
      </div>

      <BookingSteps booking={booking} />

      <Section title={t("sent.yourRequest")}>
        <DetailRow label={t("common.bike")} value={booking.bike.name} />
        {booking.planName && (
          <DetailRow label={t("common.plan")} value={booking.planName} />
        )}
        <DetailRow
          label={t("common.dates")}
          value={formatPeriod(booking.startsAt, booking.endsAt, locale)}
        />
        <DetailRow
          label={t("common.price")}
          value={t("common.priceValue", { price: booking.price })}
        />
      </Section>

      {/* TODO(К-5): the real address and what to bring — ask the client. */}
      <Section title={t("sent.whereAndHow")}>
        <DetailRow label={t("sent.address")} value={t("sent.addressValue")} />
        <DetailRow
          label={t("common.payment")}
          value={t("common.paymentOptions")}
        />
      </Section>

      <ButtonLink href="/" replace>
        {t("sent.toHome")}
      </ButtonLink>
    </>
  );
}
