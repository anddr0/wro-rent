"use client";

import { MessageCircle, Pencil } from "lucide-react";
import { useParams } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { DetailRow, Row, Section } from "@/components/section";
import type { DemoBooking } from "@/lib/demo-data";
import { findDemoBooking } from "@/lib/demo-data";

export default function AdminBookingPage() {
  const { id } = useParams<{ id: string }>();
  // TODO(slice 4.2): the booking from the API.
  const booking = findDemoBooking(id);

  if (!booking) {
    return <NotFoundText>Бронь не найдена</NotFoundText>;
  }

  return (
    <>
      <PageTitle
        description={booking.planName}
        end={<BookingStatusBadge status={booking.status} />}
      >
        {booking.bikeName}
      </PageTitle>

      <Section title="Клиент">
        <Row
          start={
            <Avatar photoUrl={null} name={booking.customerName} size={40} />
          }
          title={booking.customerName}
          subtitle={`@${booking.customerUsername}`}
          // TODO(slice 4.2): open a chat with the customer.
          end={
            <Button variant="secondary" size="small">
              <MessageCircle />
              Написать
            </Button>
          }
        />
      </Section>

      <Section title="Аренда">
        <DetailRow label="Начало" value={booking.startsAt} />
        <DetailRow label="Конец" value={booking.endsAt} />
        <DetailRow label="Тариф" value={booking.planName} />
        {/* TODO(slice 4.5): change the price. */}
        <DetailRow
          label="Цена"
          value={
            <span className="inline-flex items-center gap-2">
              {booking.price} zł
              <Pencil className="size-4 text-muted-foreground" />
            </span>
          }
        />
        {booking.comment && (
          <DetailRow label="Комментарий" value={booking.comment} />
        )}
      </Section>

      {/* TODO(slice 4.5): edit deposit, payment and the note. */}
      <Section title="Оплата">
        <DetailRow label="Депозит" value="—" />
        <DetailRow label="Оплата" value="не оплачено" />
        <DetailRow label="Заметка" value="—" />
      </Section>

      <StatusActions status={booking.status} />
    </>
  );
}

// TODO(slices 4.3, 4.4): make the buttons work.
function StatusActions({ status }: { status: DemoBooking["status"] }) {
  if (status === "pending") {
    return (
      <BottomBar>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="destructive">Отклонить</Button>
          <Button>Подтвердить</Button>
        </div>
      </BottomBar>
    );
  }
  if (status === "confirmed") {
    return (
      <BottomBar>
        <Button>Выдал велосипед</Button>
        <Button variant="destructive">Отменить бронь</Button>
      </BottomBar>
    );
  }
  if (status === "active") {
    return (
      <BottomBar>
        <Button>Принял велосипед</Button>
      </BottomBar>
    );
  }
  // Finished bookings: nothing to do but edit price, payment and the note.
  return null;
}
