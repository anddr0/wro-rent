import { BOOKING_ACTIONS } from "@/lib/admin-bookings";
import type { AdminBookingResponse, BookingAction } from "@/lib/admin-bookings";
import { performBookingAction } from "@/server/admin-bookings";
import { requireAdmin } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid, readJson } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

// Moves a booking on (А-7): { action: "confirm" } and so on, see BookingAction.
// The customer gets a message when it concerns them.
export const POST = withErrorHandling(
  async (req, ctx: RouteContext<"/api/admin/bookings/[id]/status">) => {
    await requireAdmin(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Booking not found");
    }

    const body = await readJson(req);
    const action = readAction(body.action);
    const booking = await performBookingAction(
      createSupabaseClient(),
      id,
      action,
    );

    const response: AdminBookingResponse = { booking };
    return Response.json(response);
  },
);

function readAction(value: unknown): BookingAction {
  for (const action of BOOKING_ACTIONS) {
    if (action === value) {
      return action;
    }
  }
  throw new HttpError(400, "Unknown action");
}
