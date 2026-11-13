"use client";

import { BikeForm } from "@/components/admin/bike-form";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { PageTitle } from "@/components/page-title";
import { useT } from "@/lib/i18n/use-t";

export default function NewBikePage() {
  const t = useT();

  return (
    <>
      <PageTitle>{t("adminBike.new")}</PageTitle>
      <BikeForm />
      <BottomBar>
        <Button>{t("adminBike.create")}</Button>
      </BottomBar>
    </>
  );
}
