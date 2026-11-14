import type { AdminBikeResponse, AdminBikesResponse } from "@/lib/admin-bikes";
import { createBike, listAdminBikes } from "@/server/admin-bikes";
import { requireAdmin } from "@/server/auth";
import { readBikeFields } from "@/server/bike-fields";
import { withErrorHandling } from "@/server/http";
import { readJson } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

// The admin's bikes (А-1). ?archived=1 — the archive instead (А-5).
export const GET = withErrorHandling(async (req) => {
  await requireAdmin(req);
  const isArchived = new URL(req.url).searchParams.get("archived") === "1";

  const bikes = await listAdminBikes(createSupabaseClient(), isArchived);

  const response: AdminBikesResponse = { bikes };
  return Response.json(response);
});

// Adds a bike (А-2): { name, description, isAvailable }.
export const POST = withErrorHandling(async (req) => {
  await requireAdmin(req);
  const fields = readBikeFields(await readJson(req));

  const bike = await createBike(createSupabaseClient(), fields);

  const response: AdminBikeResponse = { bike };
  return Response.json(response, { status: 201 });
});
