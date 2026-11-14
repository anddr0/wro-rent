import type { AdminBikeResponse } from "@/lib/admin-bikes";
import { getAdminBike } from "@/server/admin-bikes";
import { requireAdmin } from "@/server/auth";
import { deleteBikePhoto } from "@/server/bike-photos";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

// Deletes one photo of a bike (А-3). Answers with the bike and the photos left.
export const DELETE = withErrorHandling(
  async (req, ctx: RouteContext<"/api/admin/bikes/[id]/photos/[photoId]">) => {
    await requireAdmin(req);
    const { id, photoId } = await ctx.params;

    if (!isUuid(id) || !isUuid(photoId)) {
      throw new HttpError(404, "Photo not found");
    }

    const supabase = createSupabaseClient();
    await deleteBikePhoto(supabase, id, photoId);

    const response: AdminBikeResponse = {
      bike: await getAdminBike(supabase, id),
    };
    return Response.json(response);
  },
);
