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
  // False for a user the bot must ignore (the allow list, see access.ts).
  isAllowed: (telegramId: number) => boolean;
};

// Transport-agnostic bot: the web app feeds it updates via webhook.
export function createBot({
  token,
  miniAppUrl,
  supabase,
  isAllowed,
}: BotConfig) {
  const bot = new Bot(token);

  // Goes first, so it runs before every command: a user who isn't allowed
  // gets no answer at all, as if the bot was switched off.
  bot.use(async (ctx, next) => {
    if (ctx.from && !isAllowed(ctx.from.id)) {
      return;
    }
    await next();
  });

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

  // Errors of the handlers above are caught in the webhook route
  // (src/app/api/telegram/webhook/route.ts): bot.catch() works only with
  // long polling, which we don't use.

  return bot;
}
