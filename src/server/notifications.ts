import "server-only";
import type { CustomerBooking } from "@/lib/bookings";
import type { Tables } from "@/lib/database.types";
import { resolveLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { createTranslate } from "@/lib/i18n/translate";
import type { Translate } from "@/lib/i18n/translate";
import { formatPeriod } from "@/lib/rental-time";
import { ratingAsStars } from "@/lib/reviews";
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
  const admins = await listAdmins(supabase);

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
  | "priceChanged"
  // The bike is back: thanks, and an invitation to review it.
  | "completed";

const NOTICE_TITLES: Record<CustomerNotice, MessageKey> = {
  confirmed: "notify.confirmed",
  rejected: "notify.rejected",
  datesTaken: "notify.datesTaken",
  cancelledByAdmin: "notify.cancelledByAdmin",
  priceChanged: "notify.priceChanged",
  completed: "notify.completed",
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

  // The review is left in the booking card, so the button leads there too.
  let buttonText = t("notify.open");
  if (notice === "completed") {
    lines.push("", t("notify.reviewAsk"));
    buttonText = t("notify.leaveReview");
  }

  await sendTelegramMessage(customer.telegram_id, lines.join("\n"), {
    text: buttonText,
    path: `/bookings/${booking.id}`,
  });
}

export type NewReviewNotice = {
  customerName: string;
  bikeName: string;
  rating: number;
  comment: string | null;
};

// Tells every admin about a review that waits for approval.
export async function notifyAdminsAboutNewReview(
  supabase: Supabase,
  review: NewReviewNotice,
): Promise<void> {
  const admins = await listAdmins(supabase);

  await Promise.all(
    admins.map((admin) => {
      const t = createTranslate(recipientLocale(admin));

      const lines = [
        t("notify.newReview", { customer: review.customerName }),
        "",
        `${review.bikeName} · ${ratingAsStars(review.rating)}`,
      ];
      if (review.comment) {
        lines.push("", review.comment);
      }

      return sendTelegramMessage(admin.telegram_id, lines.join("\n"), {
        text: t("notify.open"),
        path: "/admin/reviews",
      });
    }),
  );
}

// Everyone with the admin role. An empty list if they couldn't be loaded:
// what the message is about is saved and shows up in the admin's lists anyway.
async function listAdmins(supabase: Supabase): Promise<Recipient[]> {
  const { data, error } = await supabase
    .from("users")
    .select("telegram_id, locale, language_code")
    .eq("role", "admin");

  if (error) {
    console.error("Could not load admins to notify:", error.message);
    return [];
  }
  return data;
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
