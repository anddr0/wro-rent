import type {
  AdminBookingResponse,
  BookingDetailsUpdate,
  PaymentMethod,
} from "@/lib/admin-bookings";
import { Constants } from "@/lib/database.types";
import { getAdminBooking, updateBookingDetails } from "@/server/admin-bookings";
import { requireAdmin } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import {
  isUuid,
  readAmount,
  readJson,
  readOptionalText,
} from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

const MAX_NOTE_LENGTH = 1000;

// One booking with its customer (А-7).
export const GET = withErrorHandling(
  async (req, ctx: RouteContext<"/api/admin/bookings/[id]">) => {
    await requireAdmin(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Booking not found");
    }

    const booking = await getAdminBooking(createSupabaseClient(), id);

    const response: AdminBookingResponse = { booking };
    return Response.json(response);
  },
);

// Changes the price, the payment and the note:
// { price, deposit, paymentMethod, isPaid, adminNote }.
export const PATCH = withErrorHandling(
  async (req, ctx: RouteContext<"/api/admin/bookings/[id]">) => {
    await requireAdmin(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Booking not found");
    }

    const update = readDetailsUpdate(await readJson(req));
    const booking = await updateBookingDetails(
      createSupabaseClient(),
      id,
      update,
    );

    const response: AdminBookingResponse = { booking };
    return Response.json(response);
  },
);

function readDetailsUpdate(
  body: Record<string, unknown>,
): BookingDetailsUpdate {
  let deposit: number | null = null;
  if (body.deposit !== null && body.deposit !== undefined) {
    deposit = readAmount(body.deposit, "deposit");
  }

  if (typeof body.isPaid !== "boolean") {
    throw new HttpError(400, "isPaid must be true or false");
  }

  return {
    price: readAmount(body.price, "price"),
    deposit,
    paymentMethod: readPaymentMethod(body.paymentMethod),
    isPaid: body.isPaid,
    adminNote:
      readOptionalText(body.adminNote, "adminNote", MAX_NOTE_LENGTH) ?? "",
  };
}

function readPaymentMethod(value: unknown): PaymentMethod | null {
  if (value === null || value === undefined) {
    return null;
  }
  for (const method of Constants.public.Enums.payment_method) {
    if (method === value) {
      return method;
    }
  }
  throw new HttpError(400, "Unknown payment method");
}
