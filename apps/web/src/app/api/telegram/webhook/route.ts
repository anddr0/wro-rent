import { webhookCallback } from "grammy";
import { createBot } from "@vityas/bot";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

let handleUpdate: ((req: Request) => Promise<Response>) | undefined;

// Telegram POSTs every update here; the secret header proves it came from Telegram.
export async function POST(req: Request) {
  handleUpdate ??= webhookCallback(
    createBot({
      token: env.botToken(),
      miniAppUrl: env.appUrl(),
      supabase: createAdminClient(),
    }),
    "std/http",
    { secretToken: env.webhookSecret() },
  );
  return handleUpdate(req);
}
