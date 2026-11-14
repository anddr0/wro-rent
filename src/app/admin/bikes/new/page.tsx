"use client";

import { useRouter } from "next/navigation";
import { BikeForm } from "@/components/admin/bike-form";
import { PageTitle } from "@/components/page-title";
import type { AdminBikeResponse, BikeFields } from "@/lib/admin-bikes";
import { apiSendJson } from "@/lib/api";
import { useT } from "@/lib/i18n/use-t";
import { refreshBikes } from "@/lib/refresh-bikes";

const EMPTY_BIKE: BikeFields = { name: "", description: "", isAvailable: true };

export default function NewBikePage() {
  const t = useT();
  const router = useRouter();

  async function createBike(fields: BikeFields) {
    const { bike } = await apiSendJson<AdminBikeResponse>(
      "POST",
      "/api/admin/bikes",
      fields,
    );
    await refreshBikes();
    // Straight to the new bike's page, where photos are added.
    // replace: "back" from there goes to the list, not to this empty form.
    router.replace(`/admin/bikes/${bike.id}`);
  }

  return (
    <>
      <PageTitle description={t("bikeForm.photosAfterCreate")}>
        {t("adminBike.new")}
      </PageTitle>
      <BikeForm
        initialFields={EMPTY_BIKE}
        submitLabel={t("adminBike.create")}
        onSubmit={createBike}
      />
    </>
  );
}
