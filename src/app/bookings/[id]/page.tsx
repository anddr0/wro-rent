"use client";

import { useParams } from "next/navigation";
import { BikePhoto } from "@/components/bike-photo";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { Button } from "@/components/button";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { DetailRow, Section } from "@/components/section";
import { findDemoBooking } from "@/lib/demo-data";

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  // TODO(slice 3.2): the booking from the API.
  const booking = findDemoBooking(id);

  if (!booking) {
    return <NotFoundText>Бронь не найдена</NotFoundText>;
  }

  return (
    <>
      <PageTitle end={<BookingStatusBadge status={booking.status} />}>
        {booking.bikeName}
      </PageTitle>
      <BikePhoto size="medium" />

      <Section>
        <DetailRow label="Начало" value={booking.startsAt} />
        <DetailRow label="Конец" value={booking.endsAt} />
        <DetailRow label="Тариф" value={booking.planName} />
        <DetailRow label="Цена" value={`${booking.price} zł`} />
        {booking.comment && (
          <DetailRow label="Комментарий" value={booking.comment} />
        )}
      </Section>

      {booking.status === "pending" && (
        <>
          <p className="text-sm text-muted-foreground">
            Админ ещё не подтвердил заявку. Мы напишем вам в Telegram.
          </p>
          {/* TODO(slice 3.2): cancel after Telegram's native confirm. */}
          <Button variant="destructive">Отменить заявку</Button>
        </>
      )}

      {/* A confirmed booking is cancelled only by an admin (К-7).
          TODO(slice 3.2): open a chat with the admin. */}
      <Button variant="secondary">Написать админу</Button>
    </>
  );
}
