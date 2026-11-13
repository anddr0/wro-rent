"use client";

import { MessageCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { BikePhoto } from "@/components/bike-photo";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { Button } from "@/components/button";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { DetailRow, Section } from "@/components/section";
import { findDemoBooking } from "@/lib/demo-data";
import { useT } from "@/lib/i18n/use-t";

export default function BookingPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  // TODO(slice 3.2): the booking from the API.
  const booking = findDemoBooking(id);

  if (!booking) {
    return <NotFoundText>{t("common.bookingNotFound")}</NotFoundText>;
  }

  return (
    <>
      <PageTitle end={<BookingStatusBadge status={booking.status} />}>
        {booking.bikeName}
      </PageTitle>
      <BikePhoto size="medium" />

      <Section>
        <DetailRow label={t("common.start")} value={booking.startsAt} />
        <DetailRow label={t("common.end")} value={booking.endsAt} />
        <DetailRow label={t("common.plan")} value={booking.planName} />
        <DetailRow
          label={t("common.price")}
          value={t("common.priceValue", { price: booking.price })}
        />
        {booking.comment && (
          <DetailRow label={t("common.comment")} value={booking.comment} />
        )}
      </Section>

      {booking.status === "pending" && (
        <>
          <p className="text-sm text-muted-foreground">
            {t("booking.pendingNote")}
          </p>
          {/* TODO(slice 3.2): cancel after Telegram's native confirm. */}
          <Button variant="destructive">{t("booking.cancel")}</Button>
        </>
      )}

      {/* A confirmed booking is cancelled only by an admin (К-7).
          TODO(slice 3.2): open a chat with the admin. */}
      <Button variant="secondary">
        <MessageCircle />
        {t("common.contactAdmin")}
      </Button>
    </>
  );
}
