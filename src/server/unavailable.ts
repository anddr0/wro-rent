import "server-only";
import type { Period } from "@/lib/booking-slots";
import { MAX_UNAVAILABLE_DAYS } from "@/lib/unavailable";
import type { UnavailablePeriod } from "@/lib/unavailable";
import { HttpError } from "@/server/http";
import type { Supabase } from "@/server/supabase";

const DAY = 24 * 60 * 60 * 1000;

// The periods of a bike that aren't over yet, the nearest first.
export async function listUnavailablePeriods(
  supabase: Supabase,
  bikeId: string,
  now: Date,
): Promise<UnavailablePeriod[]> {
  const { data, error } = await supabase
    .from("bike_unavailable_periods")
    .select("id, starts_at, ends_at")
    .eq("bike_id", bikeId)
    .gt("ends_at", now.toISOString())
    .order("starts_at");

  if (error) {
    throw error;
  }
  return data.map((row) => ({
    id: row.id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  }));
}

// The same periods as plain "from – to", for the customer's calendar:
// there they are busy time like any booking.
export async function listUnavailableTimes(
  supabase: Supabase,
  bikeId: string,
  now: Date,
): Promise<Period[]> {
  const periods = await listUnavailablePeriods(supabase, bikeId, now);
  return periods.map((period) => ({
    startsAt: period.startsAt,
    endsAt: period.endsAt,
  }));
}

// Is the bike marked unavailable at any moment between these two?
export async function isBikeUnavailable(
  supabase: Supabase,
  bikeId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("bike_unavailable_periods")
    .select("id")
    .eq("bike_id", bikeId)
    // Overlaps: starts before our end and ends after our start.
    .lt("starts_at", endsAt.toISOString())
    .gt("ends_at", startsAt.toISOString())
    .limit(1);

  if (error) {
    throw error;
  }
  return data.length > 0;
}

// Marks the bike unavailable from `startsAt` to `endsAt`. Bookings that
// already exist for this time are not touched: the admin sees them in the
// form and deals with them.
export async function addUnavailablePeriod(
  supabase: Supabase,
  bikeId: string,
  startsAt: Date,
  endsAt: Date,
  now: Date,
): Promise<UnavailablePeriod> {
  if (endsAt <= startsAt) {
    throw new HttpError(400, "The end must be after the start");
  }
  // A period that is already over closes nothing.
  if (endsAt <= now) {
    throw new HttpError(400, "The period is in the past");
  }
  if (endsAt.getTime() - startsAt.getTime() > MAX_UNAVAILABLE_DAYS * DAY) {
    throw new HttpError(400, "The period is too long");
  }

  const { data: bike, error: bikeError } = await supabase
    .from("bikes")
    .select("id")
    .eq("id", bikeId)
    .maybeSingle();
  if (bikeError) {
    throw bikeError;
  }
  if (!bike) {
    throw new HttpError(404, "Bike not found");
  }

  const { data, error } = await supabase
    .from("bike_unavailable_periods")
    .insert({
      bike_id: bikeId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .select("id, starts_at, ends_at")
    .single();

  if (error) {
    throw error;
  }
  return { id: data.id, startsAt: data.starts_at, endsAt: data.ends_at };
}

export async function deleteUnavailablePeriod(
  supabase: Supabase,
  bikeId: string,
  periodId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("bike_unavailable_periods")
    .delete()
    .eq("id", periodId)
    .eq("bike_id", bikeId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new HttpError(404, "Period not found");
  }
}
