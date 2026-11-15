import type {
  AdminBookingsResponse,
  BookingStatusFilter,
} from "@/lib/admin-bookings";
import { Constants } from "@/lib/database.types";
import { parseCalendarDay } from "@/lib/rental-time";
import type { CalendarDay } from "@/lib/rental-time";
import { listAdminBookings } from "@/server/admin-bookings";
import { requireAdmin } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

// All bookings, the newest first (А-6).
// ?status=pending — one status, by default all;
// ?from=2026-12-01&to=2026-12-31 — only bookings that touch these days;
// ?bikeId=<id> — only bookings of one bike.
export const GET = withErrorHandling(async (req) => {
  await requireAdmin(req);
  const params = new URL(req.url).searchParams;

  const bikeId = params.get("bikeId");
  if (bikeId !== null && !isUuid(bikeId)) {
    throw new HttpError(400, "bikeId must be an id");
  }

  const bookings = await listAdminBookings(createSupabaseClient(), {
    status: readStatus(params.get("status")),
    from: readDay(params.get("from"), "from"),
    to: readDay(params.get("to"), "to"),
    bikeId,
  });

  const response: AdminBookingsResponse = { bookings };
  return Response.json(response);
});

function readStatus(value: string | null): BookingStatusFilter {
  if (value === null || value === "all") {
    return "all";
  }
  for (const status of Constants.public.Enums.booking_status) {
    if (status === value) {
      return status;
    }
  }
  throw new HttpError(400, "Unknown status");
}

function readDay(value: string | null, name: string): CalendarDay | null {
  if (value === null || value === "") {
    return null;
  }
  const day = parseCalendarDay(value);
  if (day === null) {
    throw new HttpError(400, `${name} must be a date like 2026-12-31`);
  }
  return day;
}
