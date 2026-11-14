import "server-only";
import { after } from "next/server";
import type {
  AdminBooking,
  AdminSummaryResponse,
  BookingAction,
  BookingDetailsUpdate,
  BookingStatusFilter,
  PaymentMethod,
} from "@/lib/admin-bookings";
import type { BookingStatus } from "@/lib/bookings";
import { fromWallTime, startOfDay, toWallTime } from "@/lib/rental-time";
import type { CalendarDay } from "@/lib/rental-time";
import { toCustomerBooking } from "@/server/bookings";
import type { BookingRow } from "@/server/bookings";
import { HttpError } from "@/server/http";
import { notifyCustomer } from "@/server/notifications";
import type { CustomerNotice, Recipient } from "@/server/notifications";
import type { Supabase } from "@/server/supabase";

// BOOKING_FIELDS from bookings.ts plus what only admins see and the customer.
// Written out in full: supabase-js reads the column types from this exact text.
const ADMIN_BOOKING_FIELDS =
  "id, status, starts_at, ends_at, price, comment, decline_reason, created_at, deposit, payment_method, paid_at, picked_up_at, returned_at, admin_note, bikes(id, name, bike_photos(path, sort_order)), rental_plans(name), users(id, full_name, username, photo_url, telegram_id, locale, language_code)";

// A row selected with ADMIN_BOOKING_FIELDS.
type AdminBookingRow = BookingRow & {
  deposit: number | null;
  payment_method: PaymentMethod | null;
  paid_at: string | null;
  picked_up_at: string | null;
  returned_at: string | null;
  admin_note: string | null;
  users: Recipient & {
    id: string;
    full_name: string;
    username: string | null;
    photo_url: string | null;
  };
};

function toAdminBooking(row: AdminBookingRow): AdminBooking {
  return {
    ...toCustomerBooking(row),
    customer: {
      id: row.users.id,
      fullName: row.users.full_name,
      username: row.users.username,
      photoUrl: row.users.photo_url,
    },
    deposit: row.deposit,
    paymentMethod: row.payment_method,
    paidAt: row.paid_at,
    pickedUpAt: row.picked_up_at,
    returnedAt: row.returned_at,
    adminNote: row.admin_note,
  };
}

// The list is for a phone screen; older bookings are found with the filters.
const LIST_LIMIT = 200;

export type AdminBookingsFilter = {
  status: BookingStatusFilter;
  // Only bookings that touch the days from `from` to `to`; null — no limit.
  from: CalendarDay | null;
  to: CalendarDay | null;
};

// Bookings of all customers, the newest first (А-6).
export async function listAdminBookings(
  supabase: Supabase,
  filter: AdminBookingsFilter,
): Promise<AdminBooking[]> {
  let query = supabase
    .from("bookings")
    .select(ADMIN_BOOKING_FIELDS)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (filter.status !== "all") {
    query = query.eq("status", filter.status);
  }
  if (filter.from !== null) {
    // Still going on at the start of the first day.
    query = query.gt("ends_at", startOfDay(filter.from).toISOString());
  }
  if (filter.to !== null) {
    // Started before the end of the last day, i.e. before the next midnight.
    const nextDay = { ...filter.to, day: filter.to.day + 1 };
    query = query.lt("starts_at", startOfDay(nextDay).toISOString());
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data.map(toAdminBooking);
}

async function findAdminBookingRow(
  supabase: Supabase,
  bookingId: string,
): Promise<AdminBookingRow | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(ADMIN_BOOKING_FIELDS)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

async function getAdminBookingRow(
  supabase: Supabase,
  bookingId: string,
): Promise<AdminBookingRow> {
  const row = await findAdminBookingRow(supabase, bookingId);
  if (!row) {
    throw new HttpError(404, "Booking not found");
  }
  return row;
}

export async function getAdminBooking(
  supabase: Supabase,
  bookingId: string,
): Promise<AdminBooking> {
  return toAdminBooking(await getAdminBookingRow(supabase, bookingId));
}

// Does what the admin pressed in the booking card (А-7) and tells the customer.
// `reason` is what the admin wrote when rejecting or cancelling, or null.
export async function performBookingAction(
  supabase: Supabase,
  bookingId: string,
  action: BookingAction,
  reason: string | null,
): Promise<AdminBooking> {
  const now = new Date().toISOString();

  if (action === "confirm") {
    return confirmBooking(supabase, bookingId);
  }

  let row: AdminBookingRow;
  let notice: CustomerNotice | null = null;

  if (action === "reject") {
    row = await moveBooking(supabase, bookingId, ["pending"], {
      status: "rejected",
      decline_reason: reason,
    });
    notice = "rejected";
  } else if (action === "cancel") {
    // Also when the bike is already with the customer: e.g. it broke down.
    row = await moveBooking(supabase, bookingId, ["confirmed", "active"], {
      status: "cancelled",
      decline_reason: reason,
    });
    notice = "cancelledByAdmin";
  } else if (action === "handOut") {
    row = await moveBooking(supabase, bookingId, ["confirmed"], {
      status: "active",
      picked_up_at: now,
    });
  } else {
    row = await moveBooking(supabase, bookingId, ["active"], {
      status: "completed",
      returned_at: now,
    });
  }

  const booking = toAdminBooking(row);
  if (notice !== null) {
    const customerNotice = notice;
    // The message is sent after the admin already has the answer,
    // so the button doesn't wait for Telegram.
    after(() => notifyCustomer(row.users, customerNotice, booking));
  }
  return booking;
}

type StatusChange = {
  status: BookingStatus;
  picked_up_at?: string;
  returned_at?: string;
  decline_reason?: string | null;
};

// Moves a booking to the next status. The current status is checked in the
// same query that changes it: if another admin was faster, nothing changes
// and this one gets "status_changed" instead of overwriting.
async function moveBooking(
  supabase: Supabase,
  bookingId: string,
  fromStatuses: BookingStatus[],
  change: StatusChange,
): Promise<AdminBookingRow> {
  const { data, error } = await supabase
    .from("bookings")
    .update(change)
    .eq("id", bookingId)
    .in("status", fromStatuses)
    .select(ADMIN_BOOKING_FIELDS)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (data) {
    return data;
  }

  // Nothing changed: either there is no such booking, or its status is another.
  await getAdminBookingRow(supabase, bookingId);
  throw new HttpError(
    409,
    "The booking is in another status now",
    "status_changed",
  );
}

// Postgres error "exclusion constraint violated": here it can only be
// bookings_no_overlap, i.e. the dates are taken by a confirmed booking.
const EXCLUSION_VIOLATION = "23P01";

// Confirms a request and rejects the other requests for the same dates —
// in one transaction, see the confirm_booking function in the migrations.
async function confirmBooking(
  supabase: Supabase,
  bookingId: string,
): Promise<AdminBooking> {
  const { data: rejectedIds, error } = await supabase.rpc("confirm_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    if (error.code === EXCLUSION_VIOLATION) {
      throw new HttpError(409, "These dates are taken", "dates_taken");
    }
    if (error.message.includes("booking_not_found")) {
      throw new HttpError(404, "Booking not found");
    }
    if (error.message.includes("booking_not_pending")) {
      throw new HttpError(
        409,
        "The booking is not pending any more",
        "status_changed",
      );
    }
    throw error;
  }

  const row = await getAdminBookingRow(supabase, bookingId);
  const booking = toAdminBooking(row);
  after(async () => {
    await notifyCustomer(row.users, "confirmed", booking);
    await notifyAboutTakenDates(supabase, rejectedIds);
  });
  return booking;
}

// Tells the customers whose requests were rejected because someone else's
// request for the same dates was confirmed.
async function notifyAboutTakenDates(
  supabase: Supabase,
  rejectedIds: string[],
): Promise<void> {
  if (rejectedIds.length === 0) {
    return;
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(ADMIN_BOOKING_FIELDS)
    .in("id", rejectedIds);

  if (error) {
    // The bookings are already rejected; only the messages are lost.
    console.error("Could not load rejected bookings to notify:", error.message);
    return;
  }

  await Promise.all(
    data.map((row) =>
      notifyCustomer(row.users, "datesTaken", toAdminBooking(row)),
    ),
  );
}

// Saves the price, the payment and the note (А-7). A new price is the only
// change the customer hears about.
export async function updateBookingDetails(
  supabase: Supabase,
  bookingId: string,
  update: BookingDetailsUpdate,
): Promise<AdminBooking> {
  const current = await getAdminBookingRow(supabase, bookingId);

  // The time of payment is set once, when "paid" is switched on.
  let paidAt: string | null = null;
  if (update.isPaid) {
    paidAt = current.paid_at ?? new Date().toISOString();
  }

  let adminNote: string | null = update.adminNote;
  if (adminNote === "") {
    adminNote = null;
  }

  const { data, error } = await supabase
    .from("bookings")
    .update({
      price: update.price,
      deposit: update.deposit,
      payment_method: update.paymentMethod,
      paid_at: paidAt,
      admin_note: adminNote,
    })
    .eq("id", bookingId)
    .select(ADMIN_BOOKING_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  const booking = toAdminBooking(data);
  if (data.price !== current.price) {
    after(() => notifyCustomer(data.users, "priceChanged", booking));
  }
  return booking;
}

// What needs the admin's attention today (А-0).
export async function getAdminSummary(
  supabase: Supabase,
  now: Date,
): Promise<AdminSummaryResponse> {
  // "Today" ends at the next midnight in Warsaw.
  const today = toWallTime(now);
  const endOfToday = fromWallTime({
    ...today,
    day: today.day + 1,
    hour: 0,
    minute: 0,
  }).toISOString();

  const [pending, toHandOut, toTakeBack] = await Promise.all([
    supabase
      .from("bookings")
      .select(ADMIN_BOOKING_FIELDS)
      .eq("status", "pending")
      .order("created_at")
      .limit(LIST_LIMIT),
    // `head: true` asks only for the number of rows, not the rows.
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .lt("starts_at", endOfToday),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .lt("ends_at", endOfToday),
  ]);

  if (pending.error) {
    throw pending.error;
  }
  if (toHandOut.error) {
    throw toHandOut.error;
  }
  if (toTakeBack.error) {
    throw toTakeBack.error;
  }

  return {
    toHandOutCount: toHandOut.count ?? 0,
    toTakeBackCount: toTakeBack.count ?? 0,
    pendingBookings: pending.data.map(toAdminBooking),
  };
}
