"use client";

import Link from "next/link";
import { useState } from "react";
import { BikePhoto } from "@/components/bike-photo";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { ButtonLink } from "@/components/button";
import { Greeting } from "@/components/home/greeting";
import { Row, Section } from "@/components/section";
import {
  cheapestDemoPlan,
  DEMO_BIKES,
  DEMO_BOOKINGS,
  isCurrentBooking,
} from "@/lib/demo-data";

// A new phrase under the greeting every time the app opens.
const GREETING_PHRASES = [
  "Нужен велосипед?",
  "Куда поедем сегодня?",
  "Погода для прогулки!",
  "Вроцлав лучше видно с велосипеда",
];

function pickRandomPhrase(): string {
  const index = Math.floor(Math.random() * GREETING_PHRASES.length);
  return GREETING_PHRASES[index];
}

export function CustomerHome() {
  const [phrase] = useState(pickRandomPhrase);
  // TODO(slice 3.1): the user's bookings from the API.
  const currentBookings = DEMO_BOOKINGS.filter(isCurrentBooking).slice(0, 3);
  // TODO(slice 1.1): visible bikes from the API.
  const bikes = DEMO_BIKES.filter((bike) => bike.isVisible);

  return (
    <>
      <Greeting subtitle={phrase} />

      {currentBookings.length === 0 ? (
        <HowItWorks />
      ) : (
        <Section title="Мои брони">
          {currentBookings.map((booking) => (
            <Row
              key={booking.id}
              href={`/bookings/${booking.id}`}
              start={<BikePhoto size="small" />}
              title={booking.bikeName}
              subtitle={`до ${booking.endsAt}`}
              badge={<BookingStatusBadge status={booking.status} />}
            />
          ))}
          <Row href="/history" title="История броней" />
        </Section>
      )}

      <section className="flex flex-col gap-1.5">
        <h2 className="px-3 text-sm text-muted-foreground">
          Свободно сейчас: {bikes.length}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {bikes.slice(0, 2).map((bike) => (
            <Link
              key={bike.id}
              href={`/bikes/${bike.id}`}
              className="flex flex-col gap-1 active:opacity-70"
            >
              <BikePhoto size="medium" />
              <span className="font-medium">{bike.name}</span>
              <span className="text-sm text-muted-foreground">
                от {cheapestDemoPlan().price} zł
              </span>
            </Link>
          ))}
        </div>
      </section>

      <ButtonLink href="/bikes">Выбрать велосипед →</ButtonLink>
    </>
  );
}

const STEPS = ["Выберите велосипед", "Оставьте заявку", "Заберите его"];

// For someone who has no bookings yet: what this is and how it works.
function HowItWorks() {
  return (
    <>
      <div className="flex flex-col gap-1 rounded-xl border bg-card p-3 shadow-sm">
        <span className="font-medium">Велосипеды в аренду во Вроцлаве</span>
        <span className="text-sm text-muted-foreground">
          от {cheapestDemoPlan().price} zł · оплата на месте или BLIK
        </span>
      </div>
      <Section title="Как это работает">
        {STEPS.map((step, index) => (
          <Row
            key={step}
            start={<span className="text-primary">{index + 1}</span>}
            title={step}
          />
        ))}
      </Section>
    </>
  );
}
