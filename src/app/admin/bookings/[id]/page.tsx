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
import { useT } from "@/lib/i18n/use-t";

export default function AdminBookingPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  // TODO(slice 4.2): the booking from the API.
  const booking = findDemoBooking(id);

  if (!booking) {
    return <NotFoundText>{t("common.bookingNotFound")}</NotFoundText>;
  }

  return (
    <>
      <PageTitle
        description={booking.planName}
        end={<BookingStatusBadge status={booking.status} />}
      >
        {booking.bikeName}
      </PageTitle>

      <Section title={t("adminBooking.customer")}>
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
              {t("adminBooking.message")}
            </Button>
          }
        />
      </Section>

      <Section title={t("adminBooking.rental")}>
        <DetailRow label={t("common.start")} value={booking.startsAt} />
        <DetailRow label={t("common.end")} value={booking.endsAt} />
        <DetailRow label={t("common.plan")} value={booking.planName} />
        {/* TODO(slice 4.5): change the price. */}
        <DetailRow
          label={t("common.price")}
          value={
            <span className="inline-flex items-center gap-2">
              {t("common.priceValue", { price: booking.price })}
              <Pencil className="size-4 text-muted-foreground" />
            </span>
          }
        />
        {booking.comment && (
          <DetailRow label={t("common.comment")} value={booking.comment} />
        )}
      </Section>

      {/* TODO(slice 4.5): edit deposit, payment and the note. */}
      <Section title={t("common.payment")}>
        <DetailRow label={t("adminBooking.deposit")} value="—" />
        <DetailRow
          label={t("common.payment")}
          value={t("adminBooking.notPaid")}
        />
        <DetailRow label={t("adminBooking.note")} value="—" />
      </Section>

      <StatusActions status={booking.status} />
    </>
  );
}

// TODO(slices 4.3, 4.4): make the buttons work.
function StatusActions({ status }: { status: DemoBooking["status"] }) {
  const t = useT();

  if (status === "pending") {
    return (
      <BottomBar>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="destructive">{t("adminBooking.reject")}</Button>
          <Button>{t("adminBooking.confirm")}</Button>
        </div>
      </BottomBar>
    );
  }
  if (status === "confirmed") {
    return (
      <BottomBar>
        <Button>{t("adminBooking.handedOut")}</Button>
        <Button variant="destructive">{t("adminBooking.cancel")}</Button>
      </BottomBar>
    );
  }
  if (status === "active") {
    return (
      <BottomBar>
        <Button>{t("adminBooking.returned")}</Button>
      </BottomBar>
    );
  }
  // Finished bookings: nothing to do but edit price, payment and the note.
  return null;
}
