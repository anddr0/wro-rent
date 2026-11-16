import "server-only";
import type { Period } from "@/lib/booking-slots";
import type { UnavailablePeriod } from "@/lib/unavailable";
import type { Supabase } from "@/server/supabase";

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
