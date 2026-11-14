"use client";

import type { Enums } from "@/lib/database.types";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";

type BookingStatus = Enums<"booking_status">;

const STATUS_LABELS: Record<BookingStatus, MessageKey> = {
  pending: "status.pending",
  confirmed: "status.confirmed",
  active: "status.active",
  completed: "status.completed",
  cancelled: "status.cancelled",
  rejected: "status.rejected",
};

const STATUS_CLASSES: Record<BookingStatus, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  confirmed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  active: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
  rejected: "bg-destructive/15 text-destructive",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const t = useT();

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {t(STATUS_LABELS[status])}
    </span>
  );
}
