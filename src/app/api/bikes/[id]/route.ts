import type { BikeResponse } from "@/lib/catalog";
import { requireUser } from "@/server/auth";
import { findVisibleBike, listActivePlans } from "@/server/catalog";
import { HttpError, withErrorHandling } from "@/server/http";
import { createSupabaseClient } from "@/server/supabase";

// Bike ids are UUIDs: 8-4-4-4-12 hex digits. Anything else can't be a bike,
// and Postgres would fail on it with an error instead of "not found".
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One bike and the plans it can be booked with (К-2).
export const GET = withErrorHandling(
  async (req, ctx: RouteContext<"/api/bikes/[id]">) => {
    await requireUser(req);
    const { id } = await ctx.params;

    if (!UUID_PATTERN.test(id)) {
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
