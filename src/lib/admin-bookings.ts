// What the admin bookings API sends to the mini app.
import type { BookingStatus, CustomerBooking } from "@/lib/bookings";
import type { Enums } from "@/lib/database.types";

export type PaymentMethod = Enums<"payment_method">;

export type BookingCustomer = {
  id: string;
  fullName: string;
  username: string | null;
  photoUrl: string | null;
};

// A booking as an admin sees it: everything the customer sees, plus who
// booked and what only admins know. Dates are ISO strings.
export type AdminBooking = CustomerBooking & {
  customer: BookingCustomer;
  deposit: number | null;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  pickedUpAt: string | null;
  returnedAt: string | null;
  // The customer never sees it.
  adminNote: string | null;
};

// GET /api/admin/bookings?status=pending&from=2026-12-01&to=2026-12-31
export type AdminBookingsResponse = { bookings: AdminBooking[] };

// GET, PATCH /api/admin/bookings/[id]; POST /api/admin/bookings/[id]/status
export type AdminBookingResponse = { booking: AdminBooking };

export type BookingStatusFilter = BookingStatus | "all";

// What an admin can do with a booking, and from which status:
// confirm, reject — pending; handOut — confirmed; takeBack — active;
// cancel — confirmed or active.
export type BookingAction =
  "confirm" | "reject" | "cancel" | "handOut" | "takeBack";

export const BOOKING_ACTIONS: BookingAction[] = [
  "confirm",
  "reject",
  "cancel",
  "handOut",
  "takeBack",
];

// The body of POST /api/admin/bookings/[id]/status. `reason` is only for
// "reject" and "cancel": what the customer is told, may be empty.
export type BookingActionRequest = {
  action: BookingAction;
  reason: string;
};

export const MAX_REASON_LENGTH = 500;

// The body of PATCH /api/admin/bookings/[id]: everything is sent at once.
export type BookingDetailsUpdate = {
  price: number;
  deposit: number | null;
  paymentMethod: PaymentMethod | null;
  isPaid: boolean;
  adminNote: string;
};

// GET /api/admin/summary
export type AdminSummaryResponse = {
  // Confirmed bookings to hand out and active ones to take back by the end
  // of today (Warsaw time), the overdue ones included.
  toHandOutCount: number;
  toTakeBackCount: number;
  // Requests waiting for an answer, the oldest first.
  pendingBookings: AdminBooking[];
};
