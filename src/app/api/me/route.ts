import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
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

// The request body as an object. Anything else (not JSON, null, a number)
// is the client's mistake, not our bug, so it's a 400 and not a 500.
async function readJson(req: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Body must be JSON");
  }

  if (typeof body !== "object" || body === null) {
    throw new HttpError(400, "Body must be a JSON object");
  }
  return body as Record<string, unknown>;
}
