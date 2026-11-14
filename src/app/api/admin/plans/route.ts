import type { AdminPlanResponse, AdminPlansResponse } from "@/lib/admin-plans";
import { createPlan, listAdminPlans } from "@/server/admin-plans";
import { requireAdmin } from "@/server/auth";
import { withErrorHandling } from "@/server/http";
import { readPlanFields } from "@/server/plan-fields";
import { readJson } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

// Every plan, hidden ones too (А-9).
export const GET = withErrorHandling(async (req) => {
  await requireAdmin(req);

  const plans = await listAdminPlans(createSupabaseClient());

  const response: AdminPlansResponse = { plans };
  return Response.json(response);
});

// Adds a plan (А-10): { name, durationCount, durationUnit, price, isActive }.
export const POST = withErrorHandling(async (req) => {
  await requireAdmin(req);
  const fields = readPlanFields(await readJson(req));

  const plan = await createPlan(createSupabaseClient(), fields);

  const response: AdminPlanResponse = { plan };
  return Response.json(response, { status: 201 });
});
