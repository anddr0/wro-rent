import type { AdminBikeResponse } from "@/lib/admin-bikes";
import { deleteBike, getAdminBike, saveBike } from "@/server/admin-bikes";
import { requireAdmin } from "@/server/auth";
import { readBikeSaveForm } from "@/server/bike-fields";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid } from "@/server/request";
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

// Saves everything changed on the bike's page at once, see BikeSaveRequest.
// A form: the request as JSON in "data", new photo files in their fields.
export const PATCH = withErrorHandling(async (req, ctx: Context) => {
  await requireAdmin(req);
  const id = await readBikeId(ctx);
  const { request, newFiles } = await readBikeSaveForm(req);

  const bike = await saveBike(
    createSupabaseClient(),
    id,
    request,
    newFiles,
    new Date(),
  );

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
