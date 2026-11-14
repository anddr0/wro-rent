import type { PublicSettingsResponse } from "@/lib/settings";
import { requireUser } from "@/server/auth";
import { withErrorHandling } from "@/server/http";
import { getRentalSettings } from "@/server/settings";
import { createSupabaseClient } from "@/server/supabase";

// What every user may know about the rental: whom to write to.
export const GET = withErrorHandling(async (req) => {
  await requireUser(req);

  const settings = await getRentalSettings(createSupabaseClient());

  const response: PublicSettingsResponse = {
    supportUsername: settings.supportUsername,
    supportPhone: settings.supportPhone,
  };
  return Response.json(response);
});
