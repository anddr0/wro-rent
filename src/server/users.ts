import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert } from "@/lib/database.types";
import type { TelegramUser } from "@/lib/telegram/types";

// Finds the user by Telegram id or creates a new customer.
// Name, username, language and avatar are refreshed from Telegram on every sign-in.
export async function upsertUserFromTelegram(
  supabase: SupabaseClient<Database>,
  telegramUser: TelegramUser,
): Promise<Tables<"users">> {
  let fullName = telegramUser.first_name;
  if (telegramUser.last_name) {
    fullName = `${fullName} ${telegramUser.last_name}`;
  }

  const row: TablesInsert<"users"> = {
    telegram_id: telegramUser.id,
    full_name: fullName,
    username: telegramUser.username ?? null,
    language_code: telegramUser.language_code ?? null,
    photo_url: telegramUser.photo_url ?? null,
  };

  const { data, error } = await supabase
    .from("users")
    .upsert(row, { onConflict: "telegram_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
