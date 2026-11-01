import "server-only";
import { createSupabaseClient } from "@/server/supabase";
import { upsertUserFromTelegram } from "@/server/users";
import { env } from "@/server/env";
import { validateInitData } from "@/server/telegram-init-data";
import { HttpError } from "@/server/http";

// The trailing space is intentional: "tmafoo" must not match.
const TMA_AUTH_HEADER = "tma ";

export function getInitDataFromRequest(req: Request): string | null {
  const header = req.headers.get("authorization");

  if (!header) {
    return null;
  }
  if (!header.startsWith(TMA_AUTH_HEADER)) {
    return null;
  }

  const authHeaderContent = header.slice(TMA_AUTH_HEADER.length).trim();

  if (!authHeaderContent) {
    return null;
  }

  return authHeaderContent;
}

// Returns the signed-in user (created on first sign-in).
// Throws HttpError 401 if the request isn't from our mini app.
export async function requireUser(req: Request) {
  const initData = getInitDataFromRequest(req);

  if (!initData) {
    throw new HttpError(401, "Not authenticated");
  }

  const validInitData = validateInitData(initData, env.botToken());

  if (!validInitData || !validInitData.user) {
    throw new HttpError(401, "No valid data");
  }

  return await upsertUserFromTelegram(
    createSupabaseClient(),
    validInitData.user,
  );
}

// Like requireUser, but also throws HttpError 403 if the user isn't an admin.
export async function requireAdmin(req: Request) {
  const user = await requireUser(req);

  if (user.role !== "admin") {
    throw new HttpError(403, "User is not admin");
  }

  return user;
}
