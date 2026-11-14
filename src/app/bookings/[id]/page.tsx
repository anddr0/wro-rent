"use client";

import { MessageCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BikePhoto } from "@/components/bike-photo";
import { BookingSteps } from "@/components/booking/booking-steps";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { Button } from "@/components/button";
import { ErrorState } from "@/components/error-state";
import { FormError } from "@/components/form-error";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { DetailRow, Section } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import { apiErrorCode, apiSendJson } from "@/lib/api";
import type { BookingResponse, CustomerBooking } from "@/lib/bookings";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { formatDateTime } from "@/lib/rental-time";
import { confirmInTelegram, openTelegramChat } from "@/lib/telegram/dialogs";
import { useTelegram } from "@/lib/telegram/use-telegram";
import { isNotFound, refreshApi, useApi } from "@/lib/use-api";
import { useSupportUsername } from "@/lib/use-settings";

export default function BookingPage() {
  const t = useT();
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

  return <BookingCard booking={data.booking} />;
}

// The customer's booking with what they can do about it (К-7).
function BookingCard({ booking }: { booking: CustomerBooking }) {
  const t = useT();
  const locale = useLocale();
  const { webApp } = useTelegram();
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const supportUsername = useSupportUsername();

  async function cancelRequest() {
    const isConfirmed = await confirmInTelegram(
      webApp,
      t("booking.cancelConfirm"),
    );
    if (!isConfirmed) {
      return;
    }

    setIsCancelling(true);
    setErrorKey(null);
    try {
      await apiSendJson<BookingResponse>(
        "POST",
        `/api/bookings/${booking.id}/cancel`,
      );
    } catch (error) {
      console.error(error);
      if (apiErrorCode(error) === "status_changed") {
        // E.g. the admin confirmed it a moment ago.
        setErrorKey("booking.statusChanged");
      } else {
        setErrorKey("booking.cancelFailed");
      }
    } finally {
      // Reload even after an error: the status may have changed meanwhile.
      await refreshApi("/api/bookings");
      setIsCancelling(false);
    }
  }

  return (
    <>
      <PageTitle end={<BookingStatusBadge status={booking.status} />}>
        {booking.bike.name}
      </PageTitle>
      <BikePhoto size="medium" url={booking.bike.coverUrl} />

      <Section>
        <DetailRow
          label={t("common.start")}
          value={formatDateTime(booking.startsAt, locale)}
        />
        <DetailRow
          label={t("common.end")}
          value={formatDateTime(booking.endsAt, locale)}
        />
        {booking.planName && (
          <DetailRow label={t("common.plan")} value={booking.planName} />
        )}
        <DetailRow
          label={t("common.price")}
          value={t("common.priceValue", { price: booking.price })}
        />
        <DetailRow
          label={t("common.payment")}
          value={t("common.paymentOptions")}
        />
        {booking.comment && (
          <DetailRow label={t("common.comment")} value={booking.comment} />
        )}
      </Section>

      <BookingSteps booking={booking} />

      {booking.status === "pending" && (
        <Button
          variant="destructive"
          onClick={cancelRequest}
          disabled={isCancelling}
        >
          {t("booking.cancel")}
        </Button>
      )}

      {errorKey !== null && <FormError>{t(errorKey)}</FormError>}

      {/* A confirmed booking is cancelled only by an admin (К-7). */}
      {supportUsername !== null && (
        <Button
          variant="secondary"
          onClick={() => openTelegramChat(webApp, supportUsername)}
        >
          <MessageCircle />
          {t("common.contactAdmin")}
        </Button>
      )}
    </>
  );
}
