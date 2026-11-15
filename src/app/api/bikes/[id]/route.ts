import type { BikeResponse } from "@/lib/catalog";
import { requireUser } from "@/server/auth";
import { findVisibleBike, listActivePlans } from "@/server/catalog";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid } from "@/server/request";
import { listPublicReviews } from "@/server/reviews";
import { createSupabaseClient } from "@/server/supabase";

// One bike, the plans it can be booked with and its reviews (К-2).
export const GET = withErrorHandling(
  async (req, ctx: RouteContext<"/api/bikes/[id]">) => {
    await requireUser(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Bike not found");
    }

    const supabase = createSupabaseClient();
    const [bike, plans, reviews] = await Promise.all([
      findVisibleBike(supabase, id),
      listActivePlans(supabase),
      listPublicReviews(supabase, id),
    ]);

    if (!bike) {
      throw new HttpError(404, "Bike not found");
    }

    const response: BikeResponse = { bike, plans, reviews };
    return Response.json(response);
  },
);
