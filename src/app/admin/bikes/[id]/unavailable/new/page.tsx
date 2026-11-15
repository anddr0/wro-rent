"use client";

import { useParams } from "next/navigation";
import { UnavailableForm } from "@/components/admin/unavailable-form";
import { PageTitle } from "@/components/page-title";
import { useT } from "@/lib/i18n/use-t";

// A new time when the bike can't be rented, added from the bike's page.
export default function NewUnavailablePeriodPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <PageTitle description={t("unavailable.formHint")}>
        {t("unavailable.title")}
      </PageTitle>
      <UnavailableForm bikeId={id} />
    </>
  );
}
