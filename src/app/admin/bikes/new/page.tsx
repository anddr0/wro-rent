"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BikeFieldsInputs } from "@/components/admin/bike-fields";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { FormError } from "@/components/form-error";
import { PageTitle } from "@/components/page-title";
import type { AdminBikeResponse, BikeFields } from "@/lib/admin-bikes";
import { apiSendJson } from "@/lib/api";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";
import { refreshBikes } from "@/lib/refresh-bikes";

const EMPTY_BIKE: BikeFields = { name: "", description: "", isAvailable: true };

export default function NewBikePage() {
  const t = useT();
  const router = useRouter();
  const [fields, setFields] = useState(EMPTY_BIKE);
  const [isSaving, setIsSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  async function createBike() {
    if (fields.name.trim() === "") {
      setErrorKey("bikeForm.nameRequired");
      return;
    }

    setIsSaving(true);
    setErrorKey(null);
    try {
      const { bike } = await apiSendJson<AdminBikeResponse>(
        "POST",
        "/api/admin/bikes",
        {
          name: fields.name.trim(),
          description: fields.description.trim(),
          isAvailable: fields.isAvailable,
        },
      );
      await refreshBikes();
      // Straight to the new bike's page, where photos are added.
      // replace: "back" from there goes to the list, not to this empty form.
      router.replace(`/admin/bikes/${bike.id}`);
    } catch (error) {
      console.error(error);
      setErrorKey("common.saveFailed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageTitle description={t("bikeForm.photosAfterCreate")}>
        {t("adminBike.new")}
      </PageTitle>
      <BikeFieldsInputs value={fields} onChange={setFields} />
      <BottomBar>
        {errorKey !== null && <FormError>{t(errorKey)}</FormError>}
        <Button onClick={createBike} disabled={isSaving}>
          {t("adminBike.create")}
        </Button>
      </BottomBar>
    </>
  );
}
