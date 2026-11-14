"use client";

import type { PublicSettingsResponse } from "@/lib/settings";
import { useApi } from "@/lib/use-api";

// The Telegram username customers write to with questions, set by the admin.
// Null while it loads or when the admin hasn't set one: then there is
// nobody to write to, and the "contact" buttons are hidden.
export function useSupportUsername(): string | null {
  const { data } = useApi<PublicSettingsResponse>("/api/settings");
  return data?.supportUsername ?? null;
}
