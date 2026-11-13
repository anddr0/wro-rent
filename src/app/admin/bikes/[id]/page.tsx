"use client";

import { Archive } from "lucide-react";
import { useParams } from "next/navigation";
import { BikeForm } from "@/components/admin/bike-form";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { findDemoBike } from "@/lib/demo-data";
import { useT } from "@/lib/i18n/use-t";

export default function AdminBikePage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  // TODO(slice 5.2): the bike from the API.
  const bike = findDemoBike(id);

  if (!bike) {
    return <NotFoundText>{t("common.bikeNotFound")}</NotFoundText>;
  }

  return (
    <>
      <PageTitle>{bike.name}</PageTitle>
      <BikeForm bike={bike} />
      {/* TODO(slice 5.4): archive; delete only a bike without bookings. */}
      <Button variant="destructive">
        <Archive />
        {t("adminBike.toArchive")}
      </Button>
      <BottomBar>
        <Button>{t("common.save")}</Button>
      </BottomBar>
    </>
  );
}
