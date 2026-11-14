import "server-only";
import type { RentalSettings } from "@/lib/settings";
import type { Supabase } from "@/server/supabase";

const SETTINGS_FIELDS =
  "first_start_minute, last_start_minute, is_round_the_clock, support_username";

type SettingsRow = {
  first_start_minute: number;
  last_start_minute: number;
  is_round_the_clock: boolean;
  support_username: string | null;
};

function toRentalSettings(row: SettingsRow): RentalSettings {
  return {
    firstStartMinute: row.first_start_minute,
    lastStartMinute: row.last_start_minute,
    isRoundTheClock: row.is_round_the_clock,
    supportUsername: row.support_username,
  };
}

// The table always has exactly one row: a migration creates it,
// and nothing deletes it.
export async function getRentalSettings(
  supabase: Supabase,
): Promise<RentalSettings> {
  const { data, error } = await supabase
    .from("rental_settings")
    .select(SETTINGS_FIELDS)
    .single();

  if (error) {
    throw error;
  }
  return toRentalSettings(data);
}

export async function updateRentalSettings(
  supabase: Supabase,
  settings: RentalSettings,
): Promise<RentalSettings> {
  const { data, error } = await supabase
    .from("rental_settings")
    .update({
      first_start_minute: settings.firstStartMinute,
      last_start_minute: settings.lastStartMinute,
      is_round_the_clock: settings.isRoundTheClock,
      support_username: settings.supportUsername,
    })
    .eq("id", true)
    .select(SETTINGS_FIELDS)
    .single();

  if (error) {
    throw error;
  }
  return toRentalSettings(data);
}
