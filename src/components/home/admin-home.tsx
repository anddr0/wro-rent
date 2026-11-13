"use client";

import { Bike, CalendarDays, Tags } from "lucide-react";
import { Greeting } from "@/components/home/greeting";
import { Row, Section, SectionTitle } from "@/components/section";
import { DEMO_BOOKINGS } from "@/lib/demo-data";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";

const ADMIN_SECTIONS: {
  href: string;
  title: MessageKey;
  subtitle: MessageKey;
  icon: typeof Bike;
}[] = [
  {
    href: "/admin/bookings",
    title: "adminHome.bookings",
    subtitle: "adminHome.bookingsHint",
    icon: CalendarDays,
  },
  {
    href: "/admin/bikes",
    title: "adminHome.bikes",
    subtitle: "adminHome.bikesHint",
    icon: Bike,
  },
  {
    href: "/admin/plans",
    title: "adminHome.plans",
    subtitle: "adminHome.plansHint",
    icon: Tags,
  },
];

// А-0: what needs attention today, right on opening the app.
export function AdminHome() {
  const t = useT();
  // TODO(slice 4.6): the summary from the API.
  const pendingBookings = DEMO_BOOKINGS.filter(
    (booking) => booking.status === "pending",
  );
  const toHandOut = 2;
  const toTakeBack = 1;

  return (
    <>
      <Greeting subtitle={t("adminHome.role")} />

      <section className="flex flex-col gap-2">
        <SectionTitle>{t("adminHome.today")}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <SummaryTile
            count={pendingBookings.length}
            label={t("adminHome.newRequests", {
              count: pendingBookings.length,
            })}
          />
          <SummaryTile count={toHandOut} label={t("adminHome.toHandOut")} />
          <SummaryTile count={toTakeBack} label={t("adminHome.toTakeBack")} />
        </div>
      </section>

      {pendingBookings.length > 0 && (
        <Section title={t("adminHome.awaitingReply")}>
          {pendingBookings.map((booking) => (
            <Row
              key={booking.id}
              href={`/admin/bookings/${booking.id}`}
              title={booking.bikeName}
              subtitle={`${booking.customerName} · ${booking.startsAt}`}
              end={
                <span className="font-semibold">
                  {t("common.priceValue", { price: booking.price })}
                </span>
              }
            />
          ))}
        </Section>
      )}

      <Section title={t("adminHome.manage")}>
        {ADMIN_SECTIONS.map((section) => (
          <Row
            key={section.href}
            href={section.href}
            icon={section.icon}
            title={t(section.title)}
            subtitle={t(section.subtitle)}
          />
        ))}
      </Section>
    </>
  );
}

type SummaryTileProps = {
  count: number;
  label: string;
};

function SummaryTile({ count, label }: SummaryTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
      <span className="text-3xl font-semibold tracking-tight">{count}</span>
      <span className="text-sm leading-tight text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
