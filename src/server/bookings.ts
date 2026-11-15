import "server-only";
import { bikePhotoUrl } from "@/lib/bike-photos";
import { BOOKING_RULES } from "@/lib/booking-rules";
import { isStartAllowed, overlapsAny } from "@/lib/booking-slots";
import type { Availability, Period } from "@/lib/booking-slots";
import type { BookingStatus, CustomerBooking } from "@/lib/bookings";
import { addDuration } from "@/lib/rental-time";
import { effectiveOpeningHours } from "@/lib/settings";
import { findVisibleBike } from "@/server/catalog";
import { HttpError } from "@/server/http";
import { getRentalSettings } from "@/server/settings";
import type { Supabase } from "@/server/supabase";
import { isBikeUnavailable, listUnavailableTimes } from "@/server/unavailable";

// The columns of a booking the customer sees, with its bike and plan.
export const BOOKING_FIELDS =
  "id, status, starts_at, ends_at, price, comment, decline_reason, created_at, bikes(id, name, bike_photos(path, sort_order)), rental_plans(name)";

// A row selected with BOOKING_FIELDS.
export type BookingRow = {
  id: string;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  price: number;
  comment: string | null;
  decline_reason: string | null;
  created_at: string;
  bikes: {
    id: string;
    name: string;
    bike_photos: { path: string; sort_order: number }[];
  };
  rental_plans: { name: string } | null;
};

export function toCustomerBooking(row: BookingRow): CustomerBooking {
  const coverPath = findCoverPath(row.bikes.bike_photos);

  let coverUrl: string | null = null;
  if (coverPath !== null) {
    coverUrl = bikePhotoUrl(coverPath);
  }

  let planName: string | null = null;
  if (row.rental_plans) {
    planName = row.rental_plans.name;
  }

  return {
    id: row.id,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    price: row.price,
    comment: row.comment,
    declineReason: row.decline_reason,
    createdAt: row.created_at,
    bike: { id: row.bikes.id, name: row.bikes.name, coverUrl },
    planName,
  };
}

// The cover is the photo that goes first.
function findCoverPath(
  photos: { path: string; sort_order: number }[],
): string | null {
  if (photos.length === 0) {
    return null;
  }
  let cover = photos[0];
  for (const photo of photos) {
    if (photo.sort_order < cover.sort_order) {
      cover = photo;
    }
  }
  return cover.path;
}

// When the bike is taken from now on (К-3). Requests of the user who asks
// are left out of `pending`: the warning is about other people.
export async function getBikeAvailability(
  supabase: Supabase,
  bikeId: string,
  userId: string,
  now: Date,
): Promise<Availability> {
  const [bookings, settings, unavailableTimes] = await Promise.all([
    supabase
      .from("bookings")
      .select("user_id, status, starts_at, ends_at")
      .eq("bike_id", bikeId)
      .in("status", ["pending", "confirmed", "active"])
      .gt("ends_at", now.toISOString())
      .order("starts_at"),
    getRentalSettings(supabase),
    listUnavailableTimes(supabase, bikeId, now),
  ]);

  if (bookings.error) {
    throw bookings.error;
  }

  const busy: Period[] = [];
  const pending: Period[] = [];
  for (const booking of bookings.data) {
    const period = { startsAt: booking.starts_at, endsAt: booking.ends_at };
    if (booking.status === "pending") {
      if (booking.user_id !== userId) {
        pending.push(period);
      }
    } else {
      busy.push(period);
    }
  }
  return {
    busy,
    unavailable: unavailableTimes,
    pending,
    hours: effectiveOpeningHours(settings),
  };
}

export type NewBooking = {
  bikeId: string;
  planId: string;
  startsAt: Date;
  comment: string | null;
};

// Creates a request (К-4). The price and the end are taken from the plan here,
// on the server: the mini app only says which plan and when.
export async function createBooking(
  supabase: Supabase,
  userId: string,
  newBooking: NewBooking,
  now: Date,
): Promise<CustomerBooking> {
  // Three independent lookups, so they go to the database together.
  const [settings, bike, plan] = await Promise.all([
    getRentalSettings(supabase),
    findVisibleBike(supabase, newBooking.bikeId),
    findActivePlan(supabase, newBooking.planId),
  ]);

  const hours = effectiveOpeningHours(settings);
  if (!isStartAllowed(newBooking.startsAt, now, hours)) {
    throw new HttpError(
      400,
      "This start time can't be booked",
      "start_not_allowed",
    );
  }

  if (!bike) {
    throw new HttpError(404, "Bike not found");
  }
  if (!plan) {
    throw new HttpError(409, "This plan is not offered", "plan_unavailable");
  }

  const startsAt = newBooking.startsAt;
  const endsAt = addDuration(startsAt, {
    count: plan.duration_count,
    unit: plan.duration_unit,
  });

  await Promise.all([
    checkCustomerCanBook(supabase, userId, bike.id, startsAt, endsAt),
    checkDatesAreFree(supabase, bike.id, startsAt, endsAt),
  ]);

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      bike_id: bike.id,
      plan_id: plan.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      price: plan.price,
      comment: newBooking.comment,
    })
    .select(BOOKING_FIELDS)
    .single();

  if (error) {
    throw error;
  }
  return toCustomerBooking(data);
}

async function findActivePlan(supabase: Supabase, planId: string) {
  const { data, error } = await supabase
    .from("rental_plans")
    .select("id, price, duration_count, duration_unit")
    .eq("id", planId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

// A customer can't have too many open bookings at once, and can't ask for
// the same bike twice for overlapping dates (e.g. by sending the form again).
async function checkCustomerCanBook(
  supabase: Supabase,
  userId: string,
  bikeId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<void> {
  const { data, error } = await supabase
    .from("bookings")
    .select("bike_id, starts_at, ends_at")
    .eq("user_id", userId)
    .in("status", ["pending", "confirmed", "active"]);

  if (error) {
    throw error;
  }

  if (data.length >= BOOKING_RULES.maxOpenBookingsPerCustomer) {
    throw new HttpError(409, "Too many open bookings", "too_many_bookings");
  }

  const sameBikePeriods: Period[] = [];
  for (const booking of data) {
    if (booking.bike_id === bikeId) {
      sameBikePeriods.push({
        startsAt: booking.starts_at,
        endsAt: booking.ends_at,
      });
    }
  }
  if (overlapsAny(startsAt, endsAt, sameBikePeriods)) {
    throw new HttpError(
      409,
      "You already asked for this bike for these dates",
      "already_requested",
    );
  }
}

// The database refuses overlapping confirmed bookings by itself, but a request
// is only "pending" and passes that check. So look before creating it.
async function checkDatesAreFree(
  supabase: Supabase,
  bikeId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<void> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("bike_id", bikeId)
    .in("status", ["confirmed", "active"])
    // Overlaps: starts before our end and ends after our start.
    .lt("starts_at", endsAt.toISOString())
    .gt("ends_at", startsAt.toISOString())
    .limit(1);

  if (error) {
    throw error;
  }
  if (data.length > 0) {
    throw new HttpError(409, "These dates are taken", "dates_taken");
  }

  // For the customer a time the admin closed is the same as a taken one.
  if (await isBikeUnavailable(supabase, bikeId, startsAt, endsAt)) {
    throw new HttpError(409, "These dates are taken", "dates_taken");
  }
}

// All bookings of one customer, the newest first (К-6).
export async function listCustomerBookings(
  supabase: Supabase,
  userId: string,
): Promise<CustomerBooking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_FIELDS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data.map(toCustomerBooking);
}

// One booking, if it belongs to this customer. Null otherwise.
export async function findCustomerBooking(
  supabase: Supabase,
  userId: string,
  bookingId: string,
): Promise<CustomerBooking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_FIELDS)
    .eq("id", bookingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return toCustomerBooking(data);
}

// The customer takes a request back (К-7). Only while it waits for an answer:
// a confirmed booking is cancelled by an admin.
export async function cancelOwnBooking(
  supabase: Supabase,
  userId: string,
  bookingId: string,
): Promise<CustomerBooking> {
  // The status is checked in the same query that changes it, so a request
  // the admin confirmed a moment ago can't be cancelled by accident.
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .select(BOOKING_FIELDS)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (data) {
    return toCustomerBooking(data);
  }

  // Nothing changed: either there is no such booking, or it isn't pending.
  const booking = await findCustomerBooking(supabase, userId, bookingId);
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }
  throw new HttpError(
    409,
    "Only a pending request can be cancelled",
    "status_changed",
  );
}
