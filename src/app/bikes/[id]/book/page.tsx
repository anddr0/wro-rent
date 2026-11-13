"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ButtonLink } from "@/components/button";
import { Chip } from "@/components/chip";
import { TextArea } from "@/components/form";
import { ErrorState } from "@/components/error-state";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { DetailRow, Row, Section, SectionTitle } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import type { BikeResponse } from "@/lib/catalog";
import { useT } from "@/lib/i18n/use-t";
import { isNotFound, useApi } from "@/lib/use-api";

// TODO(slice 2.2): free start times from the API.
const DEMO_TIMES = ["9:00", "10:00", "11:00", "12:00", "14:00", "16:00"];

export default function BookPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  // Same path as the bike page, so coming from there it's already loaded.
  const { data, error, mutate } = useApi<BikeResponse>(`/api/bikes/${id}`);
  const [chosenPlanId, setChosenPlanId] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  if (isNotFound(error)) {
    return <NotFoundText>{t("common.bikeNotFound")}</NotFoundText>;
  }
  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  const { bike, plans } = data;
  if (plans.length === 0) {
    return <NotFoundText>{t("book.noPlans")}</NotFoundText>;
  }

  // Until the customer picks a plan, the first one is chosen.
  const plan = plans.find((item) => item.id === chosenPlanId) ?? plans[0];
  const price = t("common.priceValue", { price: plan.price });

  return (
    <>
      <PageTitle>{bike.name}</PageTitle>

      {/* With a single plan there is nothing to choose (К-4). */}
      {plans.length > 1 && (
        <Section title={t("common.plan")}>
          {plans.map((item) => (
            <label key={item.id} className="cursor-pointer">
              <Row
                start={
                  <input
                    type="radio"
                    name="plan"
                    checked={item.id === plan.id}
                    onChange={() => setChosenPlanId(item.id)}
                    className="accent-primary"
                  />
                }
                title={item.name}
                end={
                  <span>{t("common.priceValue", { price: item.price })}</span>
                }
              />
            </label>
          ))}
        </Section>
      )}

      <Section title={t("book.startDate")}>
        {/* TODO(slice 2.2): month calendar with busy days. */}
        <div className="flex aspect-square items-center justify-center p-4 text-center text-muted-foreground">
          {t("book.calendarPlaceholder")}
        </div>
      </Section>

      <section className="flex flex-col gap-2">
        <SectionTitle>{t("book.startTime")}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {DEMO_TIMES.map((item) => (
            <Chip
              key={item}
              label={item}
              isSelected={item === time}
              onSelect={() => setTime(item)}
            />
          ))}
        </div>
      </section>

      <p className="rounded-xl bg-amber-500/15 p-3 text-sm text-amber-700 dark:text-amber-400">
        {t("book.othersWaiting")}
      </p>

      <Section title={t("book.summary")}>
        <DetailRow label={t("common.plan")} value={plan.name} />
        <DetailRow label={t("common.start")} value={`07.12 ${time ?? "—"}`} />
        <DetailRow label={t("common.price")} value={price} />
        <DetailRow
          label={t("common.payment")}
          value={t("common.paymentOptions")}
        />
      </Section>

      <TextArea placeholder={t("book.commentPlaceholder")} rows={3} />

      {/* TODO(slice 2.3): send the request, then open its "sent" screen.
          replace: "back" from there should not return to this form. */}
      <ButtonLink href="/bookings/b1/sent" replace>
        {t("book.submit")}
      </ButtonLink>
    </>
  );
}
