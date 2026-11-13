import "server-only";
import { Bot, InlineKeyboard } from "grammy";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { resolveLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { createTranslate } from "@/lib/i18n/translate";

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

  // The language the user picked in the mini app, otherwise Telegram's.
  // Someone who never opened the mini app has no row yet: Telegram's language then.
  // A failed query also falls back to it: a greeting in the wrong language
  // is better than no greeting.
  async function getLocale(
    from: { id: number; language_code?: string } | undefined,
  ): Promise<Locale> {
    if (!from) {
      return resolveLocale(null, null);
    }
    const { data } = await supabase
      .from("users")
      .select("locale")
      .eq("telegram_id", from.id)
      .maybeSingle();
    return resolveLocale(data?.locale ?? null, from.language_code);
  }

  bot.command("start", async (ctx) => {
    const locale = await getLocale(ctx.from);
    const t = createTranslate(locale);

    await ctx.reply(t("bot.welcome"), {
      reply_markup: new InlineKeyboard().webApp(t("bot.openApp"), miniAppUrl),
    });
  });

  // A health check for us, not for customers: no translation.
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
