"use client";

import type { PublicSettingsResponse } from "@/lib/settings";
import { useApi } from "@/lib/use-api";

export type SupportContacts = {
  // Telegram username, without "@".
  username: string | null;
  phone: string | null;
};

// How customers reach the rental, as the admin set it. Both are null while
// the settings load or when the admin hasn't filled them in.
export function useSupportContacts(): SupportContacts {
  const { data } = useApi<PublicSettingsResponse>("/api/settings");
  return {
    username: data?.supportUsername ?? null,
    phone: data?.supportPhone ?? null,
  };
}
