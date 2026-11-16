import type { AdminBikeResponse } from "@/lib/admin-bikes";
import { setBikePaused } from "@/server/admin-bikes";
import { requireAdmin } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid, readJson } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

// "Temporarily unavailable" on or off: { isPaused: true }.
// The bike stays in the catalog, but can't be booked while it is on.
export const POST = withErrorHandling(
  async (req, ctx: RouteContext<"/api/admin/bikes/[id]/pause">) => {
    await requireAdmin(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Bike not found");
    }

    const body = await readJson(req);
    if (typeof body.isPaused !== "boolean") {
      throw new HttpError(400, "isPaused must be true or false");
    }

    const bike = await setBikePaused(createSupabaseClient(), id, body.isPaused);

    const response: AdminBikeResponse = { bike };
    return Response.json(response);
  },
);
