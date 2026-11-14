import type { BookingResponse } from "@/lib/bookings";
import { requireUser } from "@/server/auth";
import { findCustomerBooking } from "@/server/bookings";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

// One of the user's own bookings. Someone else's is "not found", like a missing one.
export const GET = withErrorHandling(
  async (req, ctx: RouteContext<"/api/bookings/[id]">) => {
    const user = await requireUser(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Booking not found");
    }

    const booking = await findCustomerBooking(
      createSupabaseClient(),
      user.id,
      id,
    );
    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }

    const response: BookingResponse = { booking };
    return Response.json(response);
  },
);
