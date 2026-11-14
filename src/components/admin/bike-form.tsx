"use client";

import { ImagePlus } from "lucide-react";
import { BikePhoto } from "@/components/bike-photo";
import { Field, TextArea, TextInput } from "@/components/form";
import { Switch } from "@/components/switch";
import type { DemoBike } from "@/lib/demo-data";
import { useT } from "@/lib/i18n/use-t";

type BikeFormProps = {
  // Empty for a new bike.
  bike?: DemoBike;
};

// The fields of a bike. The page adds the "Save" button.
// TODO(slices 5.2, 5.3): save the form and upload photos.
export function BikeForm({ bike }: BikeFormProps) {
  const t = useT();

  return (
    <>
      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("bikeForm.photos")}</span>
        <div className="grid grid-cols-4 gap-2">
          {bike && <BikePhoto size="medium" />}
          <button
            type="button"
            className="flex aspect-4/3 items-center justify-center rounded-lg border border-dashed text-muted-foreground"
          >
            <ImagePlus className="size-6" strokeWidth={1.5} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("bikeForm.photosHint")}
        </p>
      </section>

      <Field label={t("bikeForm.name")}>
        <TextInput
          defaultValue={bike?.name}
          placeholder={t("bikeForm.namePlaceholder")}
        />
      </Field>

      <Field label={t("bikeForm.description")}>
        <TextArea
          defaultValue={bike?.description}
          placeholder={t("bikeForm.descriptionPlaceholder")}
          rows={4}
        />
      </Field>

      <Switch
        label={t("bikeForm.visible")}
        description={t("bikeForm.visibleHint")}
        isOn={bike?.isVisible ?? true}
        onChange={() => {}}
      />
    </>
  );
}
