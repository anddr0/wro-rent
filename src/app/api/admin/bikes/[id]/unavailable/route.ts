import type {
  UnavailablePeriod,
  UnavailablePeriodsResponse,
} from "@/lib/unavailable";
import { requireAdmin } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid, readJson } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";
import {
  addUnavailablePeriod,
  listUnavailablePeriods,
} from "@/server/unavailable";

type Context = RouteContext<"/api/admin/bikes/[id]/unavailable">;

// When the bike is marked unavailable, from now on.
export const GET = withErrorHandling(async (req, ctx: Context) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  if (!isUuid(id)) {
    throw new HttpError(404, "Bike not found");
  }

  const periods = await listUnavailablePeriods(
    createSupabaseClient(),
    id,
    new Date(),
  );

  const response: UnavailablePeriodsResponse = { periods };
  return Response.json(response);
});

// Marks the bike unavailable: { startsAt, endsAt } as ISO dates.
export const POST = withErrorHandling(async (req, ctx: Context) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  if (!isUuid(id)) {
    throw new HttpError(404, "Bike not found");
  }

  const body = await readJson(req);
  const period: UnavailablePeriod = await addUnavailablePeriod(
    createSupabaseClient(),
    id,
    readDate(body.startsAt, "startsAt"),
    readDate(body.endsAt, "endsAt"),
  );

  return Response.json({ period }, { status: 201 });
});

function readDate(value: unknown, fieldName: string): Date {
  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be a date`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${fieldName} must be a date`);
  }
  return date;
}
