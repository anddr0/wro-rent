import { Archive, Eye, Plus } from "lucide-react";
import { BikePhoto } from "@/components/bike-photo";
import { BottomBar } from "@/components/bottom-bar";
import { ButtonLink } from "@/components/button";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";
import { DEMO_BIKES } from "@/lib/demo-data";
import type { DemoBike } from "@/lib/demo-data";

export default function AdminBikesPage() {
  // TODO(slice 5.1): bikes from the API, without archived ones.
  const bikes = DEMO_BIKES;
  const hiddenCount = bikes.filter((bike) => !bike.isVisible).length;

  return (
    <>
      <PageTitle
        description={`${bikes.length} в парке · ${hiddenCount} скрыто`}
      >
        Автопарк
      </PageTitle>

      <Section>
        {bikes.map((bike) => (
          <Row
            key={bike.id}
            href={`/admin/bikes/${bike.id}`}
            start={<BikePhoto size="small" />}
            title={bike.name}
            subtitle={bikeState(bike)}
            badge={!bike.isVisible && <HiddenBadge />}
          />
        ))}
      </Section>

      <Section>
        <Row
          href="/bikes"
          icon={Eye}
          title="Каталог глазами клиента"
          subtitle="Как велосипеды видят клиенты"
        />
        <Row
          href="/admin/bikes/archive"
          icon={Archive}
          title="Архив"
          subtitle="Велосипеды, которые больше не сдаются"
        />
      </Section>

      <BottomBar>
        <ButtonLink href="/admin/bikes/new">
          <Plus />
          Добавить велосипед
        </ButtonLink>
      </BottomBar>
    </>
  );
}

function bikeState(bike: DemoBike): string {
  if (bike.busyUntil) {
    return `У клиента до ${bike.busyUntil}`;
  }
  return "Свободен";
}

function HiddenBadge() {
  return (
    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      Скрыт
    </span>
  );
}
