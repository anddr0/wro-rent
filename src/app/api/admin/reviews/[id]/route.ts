import type { AdminReviewResponse } from "@/lib/reviews";
import { requireAdmin } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid, readJson } from "@/server/request";
import { setReviewStatus } from "@/server/reviews";
import { createSupabaseClient } from "@/server/supabase";

// Shows a review to customers or hides it:
// { status: "approved" } or { status: "hidden" }.
export const PATCH = withErrorHandling(
  async (req, ctx: RouteContext<"/api/admin/reviews/[id]">) => {
    await requireAdmin(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Review not found");
    }

    const body = await readJson(req);
    const status = body.status;
    // "pending" can't be set by hand: it only means "nobody looked yet".
    if (status !== "approved" && status !== "hidden") {
      throw new HttpError(400, "status must be approved or hidden");
    }

    const review = await setReviewStatus(createSupabaseClient(), id, status);

    const response: AdminReviewResponse = { review };
    return Response.json(response);
  },
);
