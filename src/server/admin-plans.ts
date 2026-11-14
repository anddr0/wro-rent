import "server-only";
import type { AdminPlan, PlanFields } from "@/lib/admin-plans";
import type { Tables } from "@/lib/database.types";
import { HttpError } from "@/server/http";
import type { Supabase } from "@/server/supabase";

const PLAN_FIELDS = "id, name, duration_count, duration_unit, price, is_active";

type PlanRow = Pick<
  Tables<"rental_plans">,
  "id" | "name" | "duration_count" | "duration_unit" | "price" | "is_active"
>;

function toAdminPlan(row: PlanRow): AdminPlan {
  return {
    id: row.id,
    name: row.name,
    durationCount: row.duration_count,
    durationUnit: row.duration_unit,
    price: row.price,
    isActive: row.is_active,
  };
}

// Every plan, hidden ones too, in the order customers see them (А-9).
export async function listAdminPlans(supabase: Supabase): Promise<AdminPlan[]> {
  const { data, error } = await supabase
    .from("rental_plans")
    .select(PLAN_FIELDS)
    .order("sort_order")
    .order("created_at");

  if (error) {
    throw error;
  }
  return data.map(toAdminPlan);
}

export async function getAdminPlan(
  supabase: Supabase,
  planId: string,
): Promise<AdminPlan> {
  const { data, error } = await supabase
    .from("rental_plans")
    .select(PLAN_FIELDS)
    .eq("id", planId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new HttpError(404, "Plan not found");
  }
  return toAdminPlan(data);
}

// Adds a plan to the end of the list (А-10).
export async function createPlan(
  supabase: Supabase,
  fields: PlanFields,
): Promise<AdminPlan> {
  const { data: lastPlan, error: lastPlanError } = await supabase
    .from("rental_plans")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastPlanError) {
    throw lastPlanError;
  }

  let sortOrder = 1;
  if (lastPlan) {
    sortOrder = lastPlan.sort_order + 1;
  }

  const { data, error } = await supabase
    .from("rental_plans")
    .insert({
      name: fields.name,
      duration_count: fields.durationCount,
      duration_unit: fields.durationUnit,
      price: fields.price,
      is_active: fields.isActive,
      sort_order: sortOrder,
    })
    .select(PLAN_FIELDS)
    .single();

  if (error) {
    throw error;
  }
  return toAdminPlan(data);
}

// Changes a plan or hides it (А-10, А-11). Bookings made earlier keep the
// price and the dates they were created with.
export async function updatePlan(
  supabase: Supabase,
  planId: string,
  fields: PlanFields,
): Promise<AdminPlan> {
  const { data, error } = await supabase
    .from("rental_plans")
    .update({
      name: fields.name,
      duration_count: fields.durationCount,
      duration_unit: fields.durationUnit,
      price: fields.price,
      is_active: fields.isActive,
    })
    .eq("id", planId)
    .select(PLAN_FIELDS)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new HttpError(404, "Plan not found");
  }
  return toAdminPlan(data);
}
