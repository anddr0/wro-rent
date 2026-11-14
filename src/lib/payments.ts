import type { PaymentMethod } from "@/lib/admin-bookings";
import type { MessageKey } from "@/lib/i18n/messages/ru";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, MessageKey> = {
  cash: "payment.cash",
  blik: "payment.blik",
  card: "payment.card",
};

// What the admin can pick: the rental takes cash and BLIK (see decisions.md).
// "card" stays in the database for the day a terminal appears.
export const OFFERED_PAYMENT_METHODS: PaymentMethod[] = ["cash", "blik"];
