import type { AdminBikeResponse } from "@/lib/admin-bikes";
import { setBikeArchived } from "@/server/admin-bikes";
import { requireAdmin } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid, readJson } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

// Moves a bike to the archive or back (А-5): { isArchived: true }.
export const POST = withErrorHandling(
  async (req, ctx: RouteContext<"/api/admin/bikes/[id]/archive">) => {
    await requireAdmin(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Bike not found");
    }

    const body = await readJson(req);
    if (typeof body.isArchived !== "boolean") {
      throw new HttpError(400, "isArchived must be true or false");
    }

    const bike = await setBikeArchived(
      createSupabaseClient(),
      id,
      body.isArchived,
    );

    const response: AdminBikeResponse = { bike };
    return Response.json(response);
  },
);
