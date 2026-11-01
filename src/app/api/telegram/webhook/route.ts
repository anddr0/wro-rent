import { webhookCallback } from "grammy";
import { createBot } from "@/bot";
import { env } from "@/server/env";
import { createSupabaseClient } from "@/server/supabase";

type UpdateHandler = (req: Request) => Promise<Response>;

// Created on the first request and reused while the server process lives.
let handleUpdate: UpdateHandler | null = null;

function getUpdateHandler(): UpdateHandler {
  if (handleUpdate === null) {
    const bot = createBot({
      token: env.botToken(),
      miniAppUrl: env.appUrl(),
      supabase: createSupabaseClient(),
    });
    // Rejects requests without the secret header, so only Telegram can call us.
    handleUpdate = webhookCallback(bot, "std/http", {
      secretToken: env.webhookSecret(),
    });
  }
  return handleUpdate;
}

// Telegram sends every bot update here as a POST request.
export async function POST(req: Request) {
  const handler = getUpdateHandler();
  return handler(req);
}
