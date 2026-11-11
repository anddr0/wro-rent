"use client";

import { Archive } from "lucide-react";
import { useParams } from "next/navigation";
import { BikeForm } from "@/components/admin/bike-form";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { findDemoBike } from "@/lib/demo-data";

export default function AdminBikePage() {
  const { id } = useParams<{ id: string }>();
  // TODO(slice 5.2): the bike from the API.
  const bike = findDemoBike(id);

  if (!bike) {
    return <NotFoundText>Велосипед не найден</NotFoundText>;
  }

  return (
    <>
      <PageTitle>{bike.name}</PageTitle>
      <BikeForm bike={bike} />
      {/* TODO(slice 5.4): archive; delete only a bike without bookings. */}
      <Button variant="destructive">
        <Archive />В архив
      </Button>
      <BottomBar>
        <Button>Сохранить</Button>
      </BottomBar>
    </>
  );
}
