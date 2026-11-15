"use client";

import { useParams } from "next/navigation";
import { BikeGallery } from "@/components/bike-gallery";
import { BottomBar } from "@/components/bottom-bar";
import { ButtonLink } from "@/components/button";
import { ErrorState } from "@/components/error-state";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import type { BikeResponse } from "@/lib/catalog";
import { useT } from "@/lib/i18n/use-t";
import { formatDuration } from "@/lib/plans";
import { isNotFound, useApi } from "@/lib/use-api";

export default function BikePage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { data, error, mutate } = useApi<BikeResponse>(`/api/bikes/${id}`);

  if (isNotFound(error)) {
    return <NotFoundText>{t("common.bikeNotFound")}</NotFoundText>;
  }
  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return <BikePageSkeleton />;
  }

  const { bike, plans } = data;

  return (
    <>
      <BikeGallery photoUrls={bike.photoUrls} />

      <div className="flex flex-col gap-2">
        <PageTitle>{bike.name}</PageTitle>
        {bike.description && (
          <p className="wrap-anywhere whitespace-pre-line">
            {bike.description}
          </p>
        )}
      </div>

      {plans.length > 0 && (
        <Section title={t("bike.prices")}>
          {plans.map((plan) => (
            <Row
              key={plan.id}
              title={plan.name}
              subtitle={formatDuration(
                { count: plan.duration_count, unit: plan.duration_unit },
                t,
              )}
              end={
                <span className="font-semibold">
                  {t("common.priceValue", { price: plan.price })}
                </span>
              }
            />
          ))}
        </Section>
      )}

      {/* Without an active plan there is nothing to book. */}
      {plans.length > 0 && (
        <BottomBar>
          <ButtonLink href={`/bikes/${bike.id}/book`}>
            {t("common.book")}
          </ButtonLink>
        </BottomBar>
      )}
    </>
  );
}

function BikePageSkeleton() {
  return (
    <>
      <Skeleton className="aspect-4/3 rounded-xl" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-40 rounded-xl" />
    </>
  );
}
