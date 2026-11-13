"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BikePhoto } from "@/components/bike-photo";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { ButtonLink } from "@/components/button";
import { Greeting } from "@/components/home/greeting";
import { Row, Section, SectionTitle } from "@/components/section";
import {
  cheapestDemoPlan,
  DEMO_BIKES,
  DEMO_BOOKINGS,
  isCurrentBooking,
} from "@/lib/demo-data";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";

// A new phrase under the greeting every time the app opens.
const GREETING_PHRASES: MessageKey[] = [
  "home.phrase1",
  "home.phrase2",
  "home.phrase3",
  "home.phrase4",
];

function pickRandomPhrase(): MessageKey {
  const index = Math.floor(Math.random() * GREETING_PHRASES.length);
  return GREETING_PHRASES[index];
}

export function CustomerHome() {
  const t = useT();
  const [phrase] = useState(pickRandomPhrase);
  // TODO(slice 3.1): the user's bookings from the API.
  const currentBookings = DEMO_BOOKINGS.filter(isCurrentBooking).slice(0, 3);
  // TODO(slice 1.1): visible bikes from the API.
  const bikes = DEMO_BIKES.filter((bike) => bike.isVisible);
  const priceFrom = t("common.priceFrom", { price: cheapestDemoPlan().price });

  return (
    <>
      <Greeting subtitle={t(phrase)} />

      {currentBookings.length === 0 ? (
        <HowItWorks />
      ) : (
        <Section title={t("home.myBookings")}>
          {currentBookings.map((booking) => (
            <Row
              key={booking.id}
              href={`/bookings/${booking.id}`}
              start={<BikePhoto size="small" />}
              title={booking.bikeName}
              subtitle={t("home.until", { date: booking.endsAt })}
              badge={<BookingStatusBadge status={booking.status} />}
            />
          ))}
          <Row href="/history" title={t("home.history")} />
        </Section>
      )}

      <section className="flex flex-col gap-2">
        <SectionTitle>
          {t("home.availableNow", { count: bikes.length })}
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {bikes.slice(0, 2).map((bike) => (
            <Link
              key={bike.id}
              href={`/bikes/${bike.id}`}
              className="flex flex-col gap-1 active:opacity-70"
            >
              <BikePhoto size="medium" />
              <span className="font-medium">{bike.name}</span>
              <span className="text-sm text-muted-foreground">{priceFrom}</span>
            </Link>
          ))}
        </div>
      </section>

      <ButtonLink href="/bikes">
        {t("home.chooseBike")}
        <ArrowRight />
      </ButtonLink>
    </>
  );
}

const STEPS: MessageKey[] = [
  "home.stepChoose",
  "home.stepRequest",
  "home.stepPickUp",
];

// For someone who has no bookings yet: what this is and how it works.
function HowItWorks() {
  const t = useT();

  return (
    <>
      <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
        <span className="font-medium">{t("home.pitchTitle")}</span>
        <span className="text-sm text-muted-foreground">
          {t("home.pitchDetails", { price: cheapestDemoPlan().price })}
        </span>
      </div>
      <Section title={t("home.howItWorks")}>
        {STEPS.map((step, index) => (
          <Row
            key={step}
            start={<span className="font-semibold">{index + 1}</span>}
            title={t(step)}
          />
        ))}
      </Section>
    </>
  );
}
