import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { bikePhotoUrl } from "@/lib/bike-photos";
import type { BikeDetails, CatalogBike, CatalogPlan } from "@/lib/catalog";
import type { Database } from "@/lib/database.types";

type Supabase = SupabaseClient<Database>;

// Bikes customers can see (К-1): not hidden and not archived.
// Each comes with its cover photo.
export async function listVisibleBikes(
  supabase: Supabase,
): Promise<CatalogBike[]> {
  const { data, error } = await supabase
    .from("bikes")
    .select("id, name, description, bike_photos(path)")
    .eq("is_available", true)
    .is("archived_at", null)
    .order("name")
    // Only the first photo of each bike: the cover.
    .order("sort_order", { referencedTable: "bike_photos" })
    .limit(1, { referencedTable: "bike_photos" });

  if (error) {
    throw error;
  }

  return data.map((bike) => {
    const cover = bike.bike_photos[0];
    return {
      id: bike.id,
      name: bike.name,
      description: bike.description,
      coverUrl: cover ? bikePhotoUrl(cover.path) : null,
    };
  });
}

// One bike with all its photos, if customers can see it.
// Null for a hidden, archived or missing bike.
export async function findVisibleBike(
  supabase: Supabase,
  bikeId: string,
): Promise<BikeDetails | null> {
  const { data, error } = await supabase
    .from("bikes")
    .select("id, name, description, bike_photos(path)")
    .eq("id", bikeId)
    .eq("is_available", true)
    .is("archived_at", null)
    .order("sort_order", { referencedTable: "bike_photos" })
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    photoUrls: data.bike_photos.map((photo) => bikePhotoUrl(photo.path)),
  };
}

// Plans customers can book, in the order the admin set. The same for every bike.
export async function listActivePlans(
  supabase: Supabase,
): Promise<CatalogPlan[]> {
  const { data, error } = await supabase
    .from("rental_plans")
    .select("id, name, price, duration_count, duration_unit")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    throw error;
  }
  return data;
}

export function cheapestPrice(plans: { price: number }[]): number | null {
  if (plans.length === 0) {
    return null;
  }
  let cheapest = plans[0].price;
  for (const plan of plans) {
    if (plan.price < cheapest) {
      cheapest = plan.price;
    }
  }
  return cheapest;
}
