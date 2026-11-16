"use client";

import { Bike } from "lucide-react";
import Link from "next/link";
import { BikeNote } from "@/components/bike-note";
import { BikePhoto } from "@/components/bike-photo";
import { ButtonLink } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageTitle } from "@/components/page-title";
import { Skeleton } from "@/components/skeleton";
import type { BikesResponse, CatalogBike } from "@/lib/catalog";
import { useT } from "@/lib/i18n/use-t";
import { useApi } from "@/lib/use-api";

export default function BikesPage() {
  const t = useT();

  return (
    <>
      <PageTitle>{t("bikes.title")}</PageTitle>
      <BikeList />
    </>
  );
}

function BikeList() {
  const t = useT();
  const { data, error, mutate } = useApi<BikesResponse>("/api/bikes");

  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return (
      <>
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </>
    );
  }
  if (data.bikes.length === 0) {
    return (
      <EmptyState
        icon={Bike}
        title={t("bikes.empty")}
        description={t("bikes.emptyHint")}
      />
    );
  }

  return data.bikes.map((bike) => (
    <BikeCard key={bike.id} bike={bike} priceFrom={data.priceFrom} />
  ));
}

type BikeCardProps = {
  bike: CatalogBike;
  priceFrom: number | null;
};

function BikeCard({ bike, priceFrom }: BikeCardProps) {
  const t = useT();

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm">
      <Link href={`/bikes/${bike.id}`} className="active:opacity-70">
        <BikePhoto size="medium" url={bike.coverUrl} />
      </Link>
      <div className="flex flex-col gap-0.5 px-1">
        <span className="font-medium wrap-anywhere">{bike.name}</span>
        <BikeNote bike={bike} priceFrom={priceFrom} />
      </div>
      {/* A paused bike can be looked at, but not booked. */}
      {bike.isPaused ? (
        <ButtonLink href={`/bikes/${bike.id}`} variant="secondary">
          {t("bikes.details")}
        </ButtonLink>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <ButtonLink href={`/bikes/${bike.id}`} variant="secondary">
            {t("bikes.details")}
          </ButtonLink>
          <ButtonLink href={`/bikes/${bike.id}/book`}>
            {t("common.book")}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
