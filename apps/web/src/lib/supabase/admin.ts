import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@vityas/db";

// Secret-key client (service_role): bypasses RLS. Use only in server code after validating Telegram initData.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}
