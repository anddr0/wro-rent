import type { Enums } from "@/lib/database.types";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import type { Translate } from "@/lib/i18n/translate";
import type { PlanDuration } from "@/lib/rental-time";

export type DurationUnit = Enums<"duration_unit">;

export const DURATION_UNITS: DurationUnit[] = ["hour", "day", "week", "month"];

const DURATION_LABELS: Record<DurationUnit, MessageKey> = {
  hour: "duration.hour",
  day: "duration.day",
  week: "duration.week",
  month: "duration.month",
};

// "3 дня", "1 неделя" — in the language of `t`.
export function formatDuration(duration: PlanDuration, t: Translate): string {
  return t(DURATION_LABELS[duration.unit], { count: duration.count });
}
