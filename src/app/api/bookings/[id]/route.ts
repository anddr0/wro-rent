import type { BookingCardResponse } from "@/lib/bookings";
import { requireUser } from "@/server/auth";
import { findCustomerBooking } from "@/server/bookings";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid } from "@/server/request";
import { findOwnReview } from "@/server/reviews";
import { createSupabaseClient } from "@/server/supabase";

// One of the user's own bookings. Someone else's is "not found", like a missing one.
export const GET = withErrorHandling(
  async (req, ctx: RouteContext<"/api/bookings/[id]">) => {
    const user = await requireUser(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Booking not found");
    }

    const supabase = createSupabaseClient();
    const [booking, review] = await Promise.all([
      findCustomerBooking(supabase, user.id, id),
      findOwnReview(supabase, id),
    ]);
    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }

    const response: BookingCardResponse = { booking, review };
    return Response.json(response);
  },
);
