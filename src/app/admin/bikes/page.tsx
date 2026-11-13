"use client";

import { Archive, Eye, Plus } from "lucide-react";
import { BikePhoto } from "@/components/bike-photo";
import { BottomBar } from "@/components/bottom-bar";
import { ButtonLink } from "@/components/button";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";
import { DEMO_BIKES } from "@/lib/demo-data";
import type { DemoBike } from "@/lib/demo-data";
import type { Translate } from "@/lib/i18n/translate";
import { useT } from "@/lib/i18n/use-t";

export default function AdminBikesPage() {
  const t = useT();
  // TODO(slice 5.1): bikes from the API, without archived ones.
  const bikes = DEMO_BIKES;
  const hiddenCount = bikes.filter((bike) => !bike.isVisible).length;

  return (
    <>
      <PageTitle
        description={t("adminBikes.summary", {
          total: bikes.length,
          hidden: hiddenCount,
        })}
      >
        {t("adminBikes.title")}
      </PageTitle>

      <Section>
        {bikes.map((bike) => (
          <Row
            key={bike.id}
            href={`/admin/bikes/${bike.id}`}
            start={<BikePhoto size="small" />}
            title={bike.name}
            subtitle={bikeState(bike, t)}
            badge={
              !bike.isVisible && <HiddenBadge label={t("adminBikes.hidden")} />
            }
          />
        ))}
      </Section>

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

function bikeState(bike: DemoBike, t: Translate): string {
  if (bike.busyUntil) {
    return t("adminBikes.busyUntil", { date: bike.busyUntil });
  }
  return t("adminBikes.free");
}

function HiddenBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  );
}
