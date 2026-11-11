import { BikePhoto } from "@/components/bike-photo";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";
import { DEMO_BOOKINGS, isCurrentBooking } from "@/lib/demo-data";

export default function HistoryPage() {
  // TODO(slice 3.1): the user's past bookings from the API.
  const pastBookings = DEMO_BOOKINGS.filter(
    (booking) => !isCurrentBooking(booking),
  );

  return (
    <>
      <PageTitle>История броней</PageTitle>
      {pastBookings.length === 0 ? (
        <p className="text-muted-foreground">Пока пусто</p>
      ) : (
        <Section>
          {pastBookings.map((booking) => (
            <Row
              key={booking.id}
              href={`/bookings/${booking.id}`}
              start={<BikePhoto size="small" />}
              title={booking.bikeName}
              subtitle={`${booking.startsAt} → ${booking.endsAt}`}
              badge={<BookingStatusBadge status={booking.status} />}
            />
          ))}
        </Section>
      )}
    </>
  );
}
