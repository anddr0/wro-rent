import { BOOKING_RULES } from "@/lib/booking-rules";
import type { BookingResponse, BookingsResponse } from "@/lib/bookings";
import { requireUser } from "@/server/auth";
import { createBooking, listCustomerBookings } from "@/server/bookings";
import type { NewBooking } from "@/server/bookings";
import { HttpError, withErrorHandling } from "@/server/http";
import { notifyAdminsAboutNewBooking } from "@/server/notifications";
import { isUuid, readJson, readOptionalText } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";
import { canBotWriteTo } from "@/server/telegram";

// The user's own bookings, the newest first (К-6).
export const GET = withErrorHandling(async (req) => {
  const user = await requireUser(req);

  const bookings = await listCustomerBookings(createSupabaseClient(), user.id);

  const response: BookingsResponse = { bookings };
  return Response.json(response);
});

// A new request (К-4): { bikeId, planId, startsAt, comment }.
export const POST = withErrorHandling(async (req) => {
  const user = await requireUser(req);
  const newBooking = readNewBooking(await readJson(req));

  // Without it we couldn't tell the customer the answer (К-8). The mini app
  // asks for the permission before sending; this is the check that it worked.
  const canWrite = await canBotWriteTo(user.telegram_id);
  if (!canWrite) {
    throw new HttpError(
      409,
      "The bot can't write to this user yet",
      "write_access_required",
    );
  }

  const supabase = createSupabaseClient();
  const booking = await createBooking(
    supabase,
    user.id,
    newBooking,
    new Date(),
  );
  await notifyAdminsAboutNewBooking(supabase, booking, user);

  const response: BookingResponse = { booking };
  return Response.json(response, { status: 201 });
});

function readNewBooking(body: Record<string, unknown>): NewBooking {
  if (!isUuid(body.bikeId)) {
    throw new HttpError(400, "bikeId must be an id");
  }
  if (!isUuid(body.planId)) {
    throw new HttpError(400, "planId must be an id");
  }
  if (typeof body.startsAt !== "string") {
    throw new HttpError(400, "startsAt must be a date");
  }

  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    throw new HttpError(400, "startsAt must be a date");
  }

  return {
    bikeId: body.bikeId,
    planId: body.planId,
    startsAt,
    comment: readOptionalText(
      body.comment,
      "comment",
      BOOKING_RULES.maxCommentLength,
    ),
  };
}
