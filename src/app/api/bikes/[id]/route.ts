import type { BikeResponse } from "@/lib/catalog";
import { requireUser } from "@/server/auth";
import { findVisibleBike, listActivePlans } from "@/server/catalog";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

// One bike and the plans it can be booked with (К-2).
export const GET = withErrorHandling(
  async (req, ctx: RouteContext<"/api/bikes/[id]">) => {
    await requireUser(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Bike not found");
    }

    const supabase = createSupabaseClient();
    const [bike, plans] = await Promise.all([
      findVisibleBike(supabase, id),
      listActivePlans(supabase),
    ]);

    if (!bike) {
      throw new HttpError(404, "Bike not found");
    }

    const response: BikeResponse = { bike, plans };
    return Response.json(response);
  },
);
