import type { AdminPlanResponse } from "@/lib/admin-plans";
import { getAdminPlan, updatePlan } from "@/server/admin-plans";
import { requireAdmin } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import { readPlanFields } from "@/server/plan-fields";
import { isUuid, readJson } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

type Context = RouteContext<"/api/admin/plans/[id]">;

// One plan for its edit page.
export const GET = withErrorHandling(async (req, ctx: Context) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  if (!isUuid(id)) {
    throw new HttpError(404, "Plan not found");
  }

  const plan = await getAdminPlan(createSupabaseClient(), id);

  const response: AdminPlanResponse = { plan };
  return Response.json(response);
});

// Saves a plan (А-10, А-11): the same fields as when creating one.
export const PATCH = withErrorHandling(async (req, ctx: Context) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  if (!isUuid(id)) {
    throw new HttpError(404, "Plan not found");
  }
  const fields = readPlanFields(await readJson(req));

  const plan = await updatePlan(createSupabaseClient(), id, fields);

  const response: AdminPlanResponse = { plan };
  return Response.json(response);
});
