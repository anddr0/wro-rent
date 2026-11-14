import "server-only";
import type { CustomerBooking } from "@/lib/bookings";
import type { Tables } from "@/lib/database.types";
import { resolveLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { createTranslate } from "@/lib/i18n/translate";
import type { Translate } from "@/lib/i18n/translate";
import { formatPeriod } from "@/lib/rental-time";
import type { Supabase } from "@/server/supabase";
import { sendTelegramMessage } from "@/server/telegram";

// Whom a message goes to: enough to find the chat and pick the language.
export type Recipient = Pick<
  Tables<"users">,
  "telegram_id" | "locale" | "language_code"
>;

function recipientLocale(recipient: Recipient): Locale {
  return resolveLocale(recipient.locale, recipient.language_code);
}

// Tells every admin about a new request (А-8).
export async function notifyAdminsAboutNewBooking(
  supabase: Supabase,
  booking: CustomerBooking,
  customer: Pick<Tables<"users">, "full_name" | "username">,
): Promise<void> {
  const { data: admins, error } = await supabase
    .from("users")
    .select("telegram_id, locale, language_code")
    .eq("role", "admin");

  if (error) {
    // The request is saved and shows up in the admin's list anyway.
    console.error("Could not load admins to notify:", error.message);
    return;
  }

  let customerName = customer.full_name;
  if (customer.username) {
    customerName = `${customer.full_name} (@${customer.username})`;
  }

  await Promise.all(
    admins.map((admin) => {
      const locale = recipientLocale(admin);
      const t = createTranslate(locale);

      const lines = [
        t("notify.newBooking", { customer: customerName }),
        "",
        ...bookingLines(booking, locale, t),
      ];
      if (booking.comment) {
        lines.push("", t("notify.comment", { comment: booking.comment }));
      }

      return sendTelegramMessage(admin.telegram_id, lines.join("\n"), {
        text: t("notify.open"),
        path: `/admin/bookings/${booking.id}`,
      });
    }),
  );
}

// What happened to a booking, for the message to its customer (К-8).
export type CustomerNotice =
  | "confirmed"
  | "rejected"
  // Another request for these dates was confirmed first.
  | "datesTaken"
  | "cancelledByAdmin"
  | "priceChanged";

const NOTICE_TITLES: Record<CustomerNotice, MessageKey> = {
  confirmed: "notify.confirmed",
  rejected: "notify.rejected",
  datesTaken: "notify.datesTaken",
  cancelledByAdmin: "notify.cancelledByAdmin",
  priceChanged: "notify.priceChanged",
};

// Tells the customer what happened to their booking, in their language.
export async function notifyCustomer(
  customer: Recipient,
  notice: CustomerNotice,
  booking: CustomerBooking,
): Promise<void> {
  const locale = recipientLocale(customer);
  const t = createTranslate(locale);

  const lines = [
    t(NOTICE_TITLES[notice]),
    "",
    ...bookingLines(booking, locale, t),
  ];

  if (booking.declineReason) {
    lines.push("", t("notify.reason", { reason: booking.declineReason }));
  }

  await sendTelegramMessage(customer.telegram_id, lines.join("\n"), {
    text: t("notify.open"),
    path: `/bookings/${booking.id}`,
  });
}

// The booking in three lines: the bike, the dates, the plan and the price.
function bookingLines(
  booking: CustomerBooking,
  locale: Locale,
  t: Translate,
): string[] {
  const price = t("common.priceValue", { price: booking.price });

  let planAndPrice = price;
  if (booking.planName) {
    planAndPrice = `${booking.planName} · ${price}`;
  }

  return [
    booking.bike.name,
    formatPeriod(booking.startsAt, booking.endsAt, locale),
    planAndPrice,
  ];
}
