import type { BookingResponse } from "@/lib/bookings";
import { requireUser } from "@/server/auth";
import { cancelOwnBooking } from "@/server/bookings";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

// The customer takes their own request back, while it is still pending (К-7).
export const POST = withErrorHandling(
  async (req, ctx: RouteContext<"/api/bookings/[id]/cancel">) => {
    const user = await requireUser(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Booking not found");
    }

    const booking = await cancelOwnBooking(createSupabaseClient(), user.id, id);

    const response: BookingResponse = { booking };
    return Response.json(response);
  },
);
