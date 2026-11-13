import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogBike, CatalogPlan } from "@/lib/catalog";
import type { Database } from "@/lib/database.types";

type Supabase = SupabaseClient<Database>;

// Bikes customers can see (К-1). Archived bikes join this rule in slice 5.4.
export async function listVisibleBikes(
  supabase: Supabase,
): Promise<CatalogBike[]> {
  const { data, error } = await supabase
    .from("bikes")
    .select("id, name, description")
    .eq("is_available", true)
    .order("name");

  if (error) {
    throw error;
  }
  return data;
}

// One bike, if customers can see it. Null for a hidden or missing bike.
export async function findVisibleBike(
  supabase: Supabase,
  bikeId: string,
): Promise<CatalogBike | null> {
  const { data, error } = await supabase
    .from("bikes")
    .select("id, name, description")
    .eq("id", bikeId)
    .eq("is_available", true)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

// Plans customers can book, in the order the admin set. The same for every bike.
export async function listActivePlans(
  supabase: Supabase,
): Promise<CatalogPlan[]> {
  const { data, error } = await supabase
    .from("rental_plans")
    .select("id, name, price")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    throw error;
  }
  return data;
}

export function cheapestPrice(plans: CatalogPlan[]): number | null {
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
