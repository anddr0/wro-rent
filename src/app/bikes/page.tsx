"use client";

import Link from "next/link";
import { BikePhoto } from "@/components/bike-photo";
import { ButtonLink } from "@/components/button";
import { PageTitle } from "@/components/page-title";
import { cheapestDemoPlan, DEMO_BIKES } from "@/lib/demo-data";
import { useT } from "@/lib/i18n/use-t";

export default function BikesPage() {
  const t = useT();
  // TODO(slice 1.1): visible bikes from the API.
  const bikes = DEMO_BIKES.filter((bike) => bike.isVisible);
  const cheapestPlan = cheapestDemoPlan();

  return (
    <>
      <PageTitle>{t("bikes.title")}</PageTitle>
      {bikes.map((bike) => (
        <div
          key={bike.id}
          className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm"
        >
          <Link href={`/bikes/${bike.id}`} className="active:opacity-70">
            <BikePhoto size="medium" />
          </Link>
          <div className="flex flex-col">
            <span className="font-medium">{bike.name}</span>
            <span className="text-sm text-muted-foreground">
              {t("bikes.priceFromPerPlan", {
                price: cheapestPlan.price,
                plan: cheapestPlan.name.toLowerCase(),
              })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ButtonLink href={`/bikes/${bike.id}`} variant="secondary">
              {t("bikes.details")}
            </ButtonLink>
            <ButtonLink href={`/bikes/${bike.id}/book`}>
              {t("common.book")}
            </ButtonLink>
          </div>
        </div>
      ))}
    </>
  );
}
