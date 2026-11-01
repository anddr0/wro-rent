import "server-only";
import { Bot, InlineKeyboard } from "grammy";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type BotConfig = {
  token: string;
  miniAppUrl: string;
  supabase: SupabaseClient<Database>;
};

// Transport-agnostic bot: the web app feeds it updates via webhook.
export function createBot({ token, miniAppUrl, supabase }: BotConfig) {
  const bot = new Bot(token);

  async function checkSupabase(): Promise<string> {
    const { error } = await supabase.auth.admin.listUsers({ perPage: 1 });
    return error ? `ошибка: ${error.message}` : "ok";
  }

  bot.command("start", (ctx) =>
    ctx.reply("Привет! Это прокат велосипедов Vityas 🚲", {
      reply_markup: new InlineKeyboard().webApp(
        "Открыть приложение",
        miniAppUrl,
      ),
    }),
  );

  bot.command("ping", async (ctx) =>
    ctx.reply(`Бот: ok\nSupabase: ${await checkSupabase()}`),
  );

  // Log only the underlying error: the BotError's ctx contains the bot token.
  bot.catch((err) =>
    console.error(
      `Bot error in update ${err.ctx.update.update_id}:`,
      err.error,
    ),
  );

  return bot;
}
