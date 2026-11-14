import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { env } from "./env";

export type Supabase = SupabaseClient<Database>;

// Uses the secret key, so it bypasses RLS and sees all data.
// Check who the user is (Telegram initData) before using it on their behalf.
export function createSupabaseClient() {
  return createClient<Database>(env.supabaseUrl(), env.supabaseSecretKey(), {
    auth: { persistSession: false },
  });
}
