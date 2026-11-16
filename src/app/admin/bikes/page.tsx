"use client";

import { Archive, Bike, Eye, Plus } from "lucide-react";
import { HiddenBadge } from "@/components/admin/hidden-badge";
import { BikePhoto } from "@/components/bike-photo";
import { BottomBar } from "@/components/bottom-bar";
import { ButtonLink } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import type { AdminBike, AdminBikesResponse } from "@/lib/admin-bikes";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { formatDate } from "@/lib/rental-time";
import { useApi } from "@/lib/use-api";

export default function AdminBikesPage() {
  const t = useT();
  const { data, error, mutate } =
    useApi<AdminBikesResponse>("/api/admin/bikes");

  let summary: string | undefined;
  if (data) {
    const hiddenCount = data.bikes.filter((bike) => !bike.isAvailable).length;
    summary = t("adminBikes.summary", {
      total: data.bikes.length,
      hidden: hiddenCount,
    });
  }

  return (
    <>
      <PageTitle description={summary}>{t("adminBikes.title")}</PageTitle>

      <BikeList
        bikes={data?.bikes}
        hasFailed={error !== undefined}
        onRetry={() => mutate()}
      />

      <Section>
        <Row
          href="/bikes"
          icon={Eye}
          title={t("adminBikes.clientView")}
          subtitle={t("adminBikes.clientViewHint")}
        />
        <Row
          href="/admin/bikes/archive"
          icon={Archive}
          title={t("adminBikes.archive")}
          subtitle={t("adminBikes.archiveHint")}
        />
      </Section>

      <BottomBar>
        <ButtonLink href="/admin/bikes/new">
          <Plus />
          {t("adminBikes.add")}
        </ButtonLink>
      </BottomBar>
    </>
  );
}

type BikeListProps = {
  bikes: AdminBike[] | undefined;
  hasFailed: boolean;
  onRetry: () => void;
};

function BikeList({ bikes, hasFailed, onRetry }: BikeListProps) {
  const t = useT();
  const locale = useLocale();

  if (hasFailed && !bikes) {
    return <ErrorState onRetry={onRetry} />;
  }
  if (!bikes) {
    return <Skeleton className="h-40 rounded-xl" />;
  }
  if (bikes.length === 0) {
    return (
      <EmptyState
        icon={Bike}
        title={t("bikes.empty")}
        description={t("adminBikes.emptyHint")}
      />
    );
  }

  return (
    <Section>
      {bikes.map((bike) => {
        let state = t("adminBikes.free");
        if (bike.busyUntil) {
          state = t("adminBikes.busyUntil", {
            date: formatDate(bike.busyUntil, locale),
          });
        }

        return (
          <Row
            key={bike.id}
            href={`/admin/bikes/${bike.id}`}
            start={<BikePhoto size="small" url={bike.coverUrl} />}
            title={bike.name}
            subtitle={state}
            badge={
              <span className="flex shrink-0 gap-1">
                {bike.isPaused && <HiddenBadge label={t("pause.badge")} />}
                {!bike.isAvailable && (
                  <HiddenBadge label={t("adminBikes.hidden")} />
                )}
              </span>
            }
          />
        );
      })}
    </Section>
  );
}
