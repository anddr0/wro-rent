import { BotError, webhookCallback } from "grammy";
import { createBot } from "@/bot";
import { isTelegramUserAllowed } from "@/server/access";
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
      isAllowed: isTelegramUserAllowed,
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

  try {
    return await handler(req);
  } catch (error) {
    // The bot failed on this update, e.g. it answered /start to someone who
    // blocked it. Still answer 200: on any other answer Telegram sends the
    // same update again and again, and it would fail every time.
    console.error("Bot failed to handle an update:", describeError(error));
    return new Response(null, { status: 200 });
  }
}

// Only the text of the error. The error object itself must not be logged:
// grammY's BotError carries the whole context, and the bot token is in it.
function describeError(error: unknown): string {
  if (error instanceof BotError && error.error instanceof Error) {
    return error.error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
