import type { AvailabilityResponse } from "@/lib/bookings";
import { requireUser } from "@/server/auth";
import { getBikeAvailability } from "@/server/bookings";
import { findVisibleBike } from "@/server/catalog";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

// When the bike is taken, for the calendar on the booking form (К-3).
export const GET = withErrorHandling(
  async (req, ctx: RouteContext<"/api/bikes/[id]/availability">) => {
    const user = await requireUser(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Bike not found");
    }

    const supabase = createSupabaseClient();
    const bike = await findVisibleBike(supabase, id);
    if (!bike) {
      throw new HttpError(404, "Bike not found");
    }

    const response: AvailabilityResponse = await getBikeAvailability(
      supabase,
      bike.id,
      user.id,
      new Date(),
    );
    return Response.json(response);
  },
);
