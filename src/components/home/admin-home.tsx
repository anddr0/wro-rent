"use client";

import { Bike, CalendarDays, Tags } from "lucide-react";
import { Greeting } from "@/components/home/greeting";
import { Row, Section, SectionTitle } from "@/components/section";
import { DEMO_BOOKINGS } from "@/lib/demo-data";

const ADMIN_SECTIONS = [
  {
    href: "/admin/bookings",
    title: "Брони",
    subtitle: "Заявки, выдача и возврат",
    icon: CalendarDays,
  },
  {
    href: "/admin/bikes",
    title: "Автопарк",
    subtitle: "Велосипеды и их фото",
    icon: Bike,
  },
  {
    href: "/admin/plans",
    title: "Тарифы",
    subtitle: "Цены для всех велосипедов",
    icon: Tags,
  },
];

// А-0: what needs attention today, right on opening the app.
export function AdminHome() {
  // TODO(slice 4.6): the summary from the API.
  const pendingBookings = DEMO_BOOKINGS.filter(
    (booking) => booking.status === "pending",
  );

  return (
    <>
      <Greeting subtitle="Администратор" />

      <section className="flex flex-col gap-2">
        <SectionTitle>Сегодня</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <SummaryTile count={pendingBookings.length} label="Новые заявки" />
          <SummaryTile count={2} label="Выдать" />
          <SummaryTile count={1} label="Принять" />
        </div>
      </section>

      {pendingBookings.length > 0 && (
        <Section title="Ждут ответа">
          {pendingBookings.map((booking) => (
            <Row
              key={booking.id}
              href={`/admin/bookings/${booking.id}`}
              title={booking.bikeName}
              subtitle={`${booking.customerName} · ${booking.startsAt}`}
              end={<span className="font-semibold">{booking.price} zł</span>}
            />
          ))}
        </Section>
      )}

      <Section title="Управление">
        {ADMIN_SECTIONS.map((section) => (
          <Row
            key={section.href}
            href={section.href}
            icon={section.icon}
            title={section.title}
            subtitle={section.subtitle}
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
