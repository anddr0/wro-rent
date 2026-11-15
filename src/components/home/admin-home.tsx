"use client";

import { Bike, CalendarDays, Clock, Tags } from "lucide-react";
import Link from "next/link";
import { ErrorState } from "@/components/error-state";
import { Greeting } from "@/components/home/greeting";
import { Row, Section, SectionTitle } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import type { AdminSummaryResponse } from "@/lib/admin-bookings";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { formatDateTime } from "@/lib/rental-time";
import { useApi } from "@/lib/use-api";

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
  {
    href: "/admin/settings",
    title: "adminHome.settings",
    subtitle: "adminHome.settingsHint",
    icon: Clock,
  },
];

// А-0: what needs attention today, right on opening the app.
export function AdminHome() {
  const t = useT();

  return (
    <>
      <Greeting subtitle={t("adminHome.role")} />

      <TodaySummary />

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

// "Today" in numbers and the requests that wait for an answer.
function TodaySummary() {
  const t = useT();
  const locale = useLocale();
  const { data, error, mutate } =
    useApi<AdminSummaryResponse>("/api/admin/summary");

  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return <Skeleton className="h-28 rounded-xl" />;
  }

  const pendingCount = data.pendingBookings.length;

  return (
    <>
      <section className="flex flex-col gap-2">
        <SectionTitle>{t("adminHome.today")}</SectionTitle>
        {/* Four tiles, two in a row: no empty corner. */}
        <div className="grid grid-cols-2 gap-2">
          <SummaryTile
            count={pendingCount}
            label={t("adminHome.newRequests", { count: pendingCount })}
            href="/admin/bookings"
          />
          <SummaryTile
            count={data.pendingReviewsCount}
            label={t("adminHome.reviews")}
            href="/admin/reviews"
          />
          <SummaryTile
            count={data.toHandOutCount}
            label={t("adminHome.toHandOut")}
            href="/admin/bookings"
          />
          <SummaryTile
            count={data.toTakeBackCount}
            label={t("adminHome.toTakeBack")}
            href="/admin/bookings"
          />
        </div>
      </section>

      {pendingCount > 0 && (
        <Section title={t("adminHome.awaitingReply")}>
          {data.pendingBookings.map((booking) => (
            <Row
              key={booking.id}
              href={`/admin/bookings/${booking.id}`}
              title={booking.bike.name}
              subtitle={`${booking.customer.fullName} · ${formatDateTime(booking.startsAt, locale)}`}
              end={
                <span className="font-semibold">
                  {t("common.priceValue", { price: booking.price })}
                </span>
              }
            />
          ))}
        </Section>
      )}
    </>
  );
}

type SummaryTileProps = {
  count: number;
  label: string;
  // The page where the things counted here are dealt with.
  href: string;
};

function SummaryTile({ count, label, href }: SummaryTileProps) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-colors active:bg-muted"
    >
      <span className="text-3xl font-semibold tracking-tight">{count}</span>
      <span className="text-sm leading-tight text-muted-foreground">
        {label}
      </span>
    </Link>
  );
}
