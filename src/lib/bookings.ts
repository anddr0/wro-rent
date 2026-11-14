// What the bookings API sends to the mini app.
import type { Availability } from "@/lib/booking-slots";
import type { Enums } from "@/lib/database.types";

export type BookingStatus = Enums<"booking_status">;

export type BookingBike = {
  id: string;
  name: string;
  coverUrl: string | null;
};

// A booking as its customer sees it. Dates are ISO strings.
export type CustomerBooking = {
  id: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  price: number;
  comment: string | null;
  // Why the admin rejected or cancelled it, if they said why.
  declineReason: string | null;
  createdAt: string;
  bike: BookingBike;
  // Null for a rental agreed individually, without a plan.
  planName: string | null;
};

// GET /api/bookings
export type BookingsResponse = { bookings: CustomerBooking[] };

// GET /api/bookings/[id], POST /api/bookings, POST /api/bookings/[id]/cancel
export type BookingResponse = { booking: CustomerBooking };

// GET /api/bikes/[id]/availability
export type AvailabilityResponse = Availability;

// The body of POST /api/bookings.
export type NewBookingRequest = {
  bikeId: string;
  planId: string;
  // ISO string.
  startsAt: string;
  comment: string;
};

// Bookings that are still going on. The rest are history.
const OPEN_STATUSES: BookingStatus[] = ["pending", "confirmed", "active"];

export function isOpenStatus(status: BookingStatus): boolean {
  return OPEN_STATUSES.includes(status);
}
