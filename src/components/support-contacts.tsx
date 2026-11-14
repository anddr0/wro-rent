"use client";

import { MessageCircle, Phone } from "lucide-react";
import { Row, Section } from "@/components/section";
import { useT } from "@/lib/i18n/use-t";
import { openTelegramChat } from "@/lib/telegram/dialogs";
import { useTelegram } from "@/lib/telegram/use-telegram";
import { useSupportContacts } from "@/lib/use-settings";

// "Contact us": a chat in Telegram and a phone number, whichever the admin
// set. Shows nothing while there is no contact at all.
export function SupportContacts() {
  const t = useT();
  const { webApp } = useTelegram();
  const { username, phone } = useSupportContacts();

  if (username === null && phone === null) {
    return null;
  }

  return (
    <Section title={t("contact.title")}>
      {username !== null && (
        <Row
          icon={MessageCircle}
          title={t("contact.write")}
          subtitle={t("contact.writeHint")}
          onClick={() => openTelegramChat(webApp, username)}
        />
      )}
      {phone !== null && (
        <Row
          icon={Phone}
          title={t("contact.call")}
          subtitle={phone}
          // A "tel:" address makes the phone offer to call the number.
          onClick={() => {
            window.location.href = `tel:${phone}`;
          }}
        />
      )}
    </Section>
  );
}
