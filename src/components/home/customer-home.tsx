"use client";

import { ArrowRight, Bike, CalendarCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BikePhoto } from "@/components/bike-photo";
import { BookingRow } from "@/components/booking/booking-row";
import { ButtonLink } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Greeting } from "@/components/home/greeting";
import { Row, Section, SectionTitle } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import type { BikesResponse } from "@/lib/catalog";
import { isOpenStatus } from "@/lib/bookings";
import type { BookingsResponse } from "@/lib/bookings";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";
import { useApi } from "@/lib/use-api";

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

// How many bikes the home page shows; the rest are in the catalog.
const BIKES_ON_HOME = 2;

export function CustomerHome() {
  const t = useT();
  const [phrase] = useState(pickRandomPhrase);
  const catalog = useApi<BikesResponse>("/api/bikes");
  const bookings = useApi<BookingsResponse>("/api/bookings");

  return (
    <>
      <Greeting subtitle={t(phrase)} />

      <MyBookings
        bookings={bookings.data}
        hasFailed={bookings.error !== undefined}
        onRetry={() => bookings.mutate()}
        priceFrom={catalog.data?.priceFrom ?? null}
      />

      <HomeBikes
        catalog={catalog.data}
        hasFailed={catalog.error !== undefined}
        onRetry={() => catalog.mutate()}
      />
    </>
  );
}

type MyBookingsProps = {
  bookings: BookingsResponse | undefined;
  hasFailed: boolean;
  onRetry: () => void;
  // For the "how it works" block shown to a newcomer.
  priceFrom: number | null;
};

// The bookings that are going on now and the way to the history (К-6).
// Someone who never booked sees how the rental works instead.
function MyBookings({
  bookings,
  hasFailed,
  onRetry,
  priceFrom,
}: MyBookingsProps) {
  const t = useT();

  if (hasFailed && !bookings) {
    return <ErrorState onRetry={onRetry} />;
  }
  if (!bookings) {
    return <Skeleton className="h-32 rounded-xl" />;
  }
  if (bookings.bookings.length === 0) {
    return <HowItWorks priceFrom={priceFrom} />;
  }

  const openBookings = bookings.bookings.filter((booking) =>
    isOpenStatus(booking.status),
  );
  const hasHistory = openBookings.length < bookings.bookings.length;

  return (
    <Section title={t("home.myBookings")}>
      {openBookings.map((booking) => (
        <BookingRow key={booking.id} booking={booking} />
      ))}
      {hasHistory && <Row href="/history" title={t("home.history")} />}
    </Section>
  );
}

type HomeBikesProps = {
  catalog: BikesResponse | undefined;
  hasFailed: boolean;
  onRetry: () => void;
};

// A peek at the catalog: how many bikes there are, the first two
// and the way to the rest.
function HomeBikes({ catalog, hasFailed, onRetry }: HomeBikesProps) {
  const t = useT();

  if (hasFailed && !catalog) {
    return <ErrorState onRetry={onRetry} />;
  }
  if (!catalog) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="aspect-4/3" />
        <Skeleton className="aspect-4/3" />
      </div>
    );
  }
  // No "choose a bike" button here: it would lead to an empty catalog.
  if (catalog.bikes.length === 0) {
    return (
      <EmptyState
        icon={Bike}
        title={t("bikes.empty")}
        description={t("bikes.emptyHint")}
      />
    );
  }

  return (
    <>
      <section className="flex flex-col gap-2">
        <SectionTitle>
          {t("home.inCatalog", { count: catalog.bikes.length })}
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {catalog.bikes.slice(0, BIKES_ON_HOME).map((bike) => (
            <Link
              key={bike.id}
              href={`/bikes/${bike.id}`}
              className="flex flex-col gap-1 active:opacity-70"
            >
              <BikePhoto size="medium" url={bike.coverUrl} />
              <span className="font-medium wrap-anywhere">{bike.name}</span>
              {catalog.priceFrom !== null && (
                <span className="text-sm text-muted-foreground">
                  {t("common.priceFrom", { price: catalog.priceFrom })}
                </span>
              )}
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

const STEPS: { icon: typeof Bike; title: MessageKey; hint: MessageKey }[] = [
  { icon: Bike, title: "home.stepChoose", hint: "home.stepChooseHint" },
  {
    icon: CalendarCheck,
    title: "home.stepRequest",
    hint: "home.stepRequestHint",
  },
  { icon: MapPin, title: "home.stepPickUp", hint: "home.stepPickUpHint" },
];

// For someone who has no bookings yet: what this is and how it works.
// The card leads to the catalog, like the button at the bottom of the page:
// a newcomer should be able to start choosing a bike from the first screen.
function HowItWorks({ priceFrom }: { priceFrom: number | null }) {
  const t = useT();

  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border-2 border-foreground bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bike className="size-6" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-lg leading-tight font-semibold">
              {t("home.pitchTitle")}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("home.pitchPayment")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Without an active plan there is no price to show. */}
          {priceFrom === null ? (
            <span />
          ) : (
            <span className="flex items-baseline gap-1.5">
              <span className="text-sm text-muted-foreground">
                {t("home.pitchFrom")}
              </span>
              <span className="text-2xl font-semibold tracking-tight">
                {t("common.priceValue", { price: priceFrom })}
              </span>
            </span>
          )}
          <ButtonLink href="/bikes" size="small" className="h-10 px-4">
            {t("home.pitchChoose")}
            <ArrowRight />
          </ButtonLink>
        </div>
      </div>

      <Section title={t("home.howItWorks")}>
        {STEPS.map((step) => (
          <Row
            key={step.title}
            icon={step.icon}
            title={t(step.title)}
            subtitle={t(step.hint)}
          />
        ))}
      </Section>
    </>
  );
}
