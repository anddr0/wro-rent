import { isValidStartMinute, parseTelegramUsername } from "@/lib/settings";
import type { AdminSettingsResponse, RentalSettings } from "@/lib/settings";
import { requireAdmin } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import { readJson } from "@/server/request";
import { getRentalSettings, updateRentalSettings } from "@/server/settings";
import { createSupabaseClient } from "@/server/supabase";

// Opening hours and the contact for customers, for the admin's settings page.
export const GET = withErrorHandling(async (req) => {
  await requireAdmin(req);

  const settings = await getRentalSettings(createSupabaseClient());

  const response: AdminSettingsResponse = { settings };
  return Response.json(response);
});

// Saves them: { firstStartMinute, lastStartMinute, isRoundTheClock, supportUsername }.
export const PATCH = withErrorHandling(async (req) => {
  await requireAdmin(req);
  const newSettings = readSettings(await readJson(req));

  const settings = await updateRentalSettings(
    createSupabaseClient(),
    newSettings,
  );

  const response: AdminSettingsResponse = { settings };
  return Response.json(response);
});

function readSettings(body: Record<string, unknown>): RentalSettings {
  const { firstStartMinute, lastStartMinute } = body;
  if (!isValidStartMinute(firstStartMinute)) {
    throw new HttpError(400, "firstStartMinute must be a time on the step");
  }
  if (!isValidStartMinute(lastStartMinute)) {
    throw new HttpError(400, "lastStartMinute must be a time on the step");
  }
  if (firstStartMinute > lastStartMinute) {
    throw new HttpError(400, "The first start can't be after the last one");
  }
  if (typeof body.isRoundTheClock !== "boolean") {
    throw new HttpError(400, "isRoundTheClock must be true or false");
  }

  return {
    firstStartMinute,
    lastStartMinute,
    isRoundTheClock: body.isRoundTheClock,
    supportUsername: readSupportUsername(body.supportUsername),
  };
}

// Null or empty text clears the contact.
function readSupportUsername(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new HttpError(400, "supportUsername must be text");
  }
  const username = parseTelegramUsername(value);
  if (username === null) {
    throw new HttpError(400, "supportUsername must be a Telegram username");
  }
  return username;
}
