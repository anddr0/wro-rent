"use client";

import { ArrowRight, Bike } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BikePhoto } from "@/components/bike-photo";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { ButtonLink } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Greeting } from "@/components/home/greeting";
import { Row, Section, SectionTitle } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import type { BikesResponse } from "@/lib/catalog";
import { DEMO_BOOKINGS, isCurrentBooking } from "@/lib/demo-data";
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
  // TODO(slice 3.1): the user's bookings from the API.
  const currentBookings = DEMO_BOOKINGS.filter(isCurrentBooking).slice(0, 3);

  return (
    <>
      <Greeting subtitle={t(phrase)} />

      {currentBookings.length === 0 ? (
        <HowItWorks priceFrom={catalog.data?.priceFrom ?? null} />
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

      <HomeBikes
        catalog={catalog.data}
        hasFailed={catalog.error !== undefined}
        onRetry={() => catalog.mutate()}
      />
    </>
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
              <BikePhoto size="medium" />
              <span className="font-medium">{bike.name}</span>
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

const STEPS: MessageKey[] = [
  "home.stepChoose",
  "home.stepRequest",
  "home.stepPickUp",
];

// For someone who has no bookings yet: what this is and how it works.
function HowItWorks({ priceFrom }: { priceFrom: number | null }) {
  const t = useT();

  let details = t("common.paymentOptions");
  if (priceFrom !== null) {
    details = t("home.pitchDetails", { price: priceFrom });
  }

  return (
    <>
      <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
        <span className="font-medium">{t("home.pitchTitle")}</span>
        <span className="text-sm text-muted-foreground">{details}</span>
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
