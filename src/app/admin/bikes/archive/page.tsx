"use client";

import { Archive } from "lucide-react";
import { BikePhoto } from "@/components/bike-photo";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import type { AdminBikesResponse } from "@/lib/admin-bikes";
import { useT } from "@/lib/i18n/use-t";
import { useApi } from "@/lib/use-api";

export default function ArchivedBikesPage() {
  const t = useT();

  return (
    <>
      <PageTitle>{t("adminArchive.title")}</PageTitle>
      <ArchivedBikes />
    </>
  );
}

// Archived bikes (А-5). A bike is brought back from its own page.
function ArchivedBikes() {
  const t = useT();
  const { data, error, mutate } = useApi<AdminBikesResponse>(
    "/api/admin/bikes?archived=1",
  );

  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return <Skeleton className="h-40 rounded-xl" />;
  }
  if (data.bikes.length === 0) {
    return (
      <EmptyState
        icon={Archive}
        title={t("adminArchive.empty")}
        description={t("adminArchive.emptyHint")}
      />
    );
  }

  return (
    <Section>
      {data.bikes.map((bike) => (
        <Row
          key={bike.id}
          href={`/admin/bikes/${bike.id}`}
          start={<BikePhoto size="small" url={bike.coverUrl} />}
          title={bike.name}
          subtitle={t("adminArchive.openToRestore")}
        />
      ))}
    </Section>
  );
}
