import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import { readJson } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";
import { updateUserLocale } from "@/server/users";

// The mini app calls this on open to find out who the user is.
export const GET = withErrorHandling(async (req) => {
  const user = await requireUser(req);
  return Response.json({ user });
});

// Changes the user's own settings. For now only the language: { locale: "pl" }.
export const PATCH = withErrorHandling(async (req) => {
  const user = await requireUser(req);
  const body = await readJson(req);

  if (!isLocale(body.locale)) {
    throw new HttpError(400, "Unknown locale");
  }

  const updatedUser = await updateUserLocale(
    createSupabaseClient(),
    user.id,
    body.locale,
  );
  return Response.json({ user: updatedUser });
});
