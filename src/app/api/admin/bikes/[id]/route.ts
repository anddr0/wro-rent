import type { AdminBikeResponse } from "@/lib/admin-bikes";
import { deleteBike, getAdminBike, updateBike } from "@/server/admin-bikes";
import { requireAdmin } from "@/server/auth";
import { readBikeFields } from "@/server/bike-fields";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid, readJson } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

type Context = RouteContext<"/api/admin/bikes/[id]">;

async function readBikeId(ctx: Context): Promise<string> {
  const { id } = await ctx.params;
  if (!isUuid(id)) {
    throw new HttpError(404, "Bike not found");
  }
  return id;
}

// One bike for its edit page (А-3).
export const GET = withErrorHandling(async (req, ctx: Context) => {
  await requireAdmin(req);
  const id = await readBikeId(ctx);

  const bike = await getAdminBike(createSupabaseClient(), id);

  const response: AdminBikeResponse = { bike };
  return Response.json(response);
});

// Saves the bike: { name, description, isAvailable }.
export const PATCH = withErrorHandling(async (req, ctx: Context) => {
  await requireAdmin(req);
  const id = await readBikeId(ctx);
  const fields = readBikeFields(await readJson(req));

  const bike = await updateBike(createSupabaseClient(), id, fields);

  const response: AdminBikeResponse = { bike };
  return Response.json(response);
});

// Deletes a bike that was never booked (А-4).
export const DELETE = withErrorHandling(async (req, ctx: Context) => {
  await requireAdmin(req);
  const id = await readBikeId(ctx);

  await deleteBike(createSupabaseClient(), id);

  return Response.json({ ok: true });
});
