"use client";

import { Field, TextArea, TextInput } from "@/components/form";
import { Switch } from "@/components/switch";
import { BIKE_LIMITS } from "@/lib/admin-bikes";
import type { BikeFields } from "@/lib/admin-bikes";
import { useT } from "@/lib/i18n/use-t";

type BikeFieldsInputsProps = {
  value: BikeFields;
  onChange: (value: BikeFields) => void;
};

// The text fields of a bike and its visibility (А-2, А-3). Only the inputs:
// the page that shows them decides when and how to save.
export function BikeFieldsInputs({ value, onChange }: BikeFieldsInputsProps) {
  const t = useT();

  return (
    <>
      <Field label={t("bikeForm.name")}>
        <TextInput
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          maxLength={BIKE_LIMITS.maxNameLength}
          placeholder={t("bikeForm.namePlaceholder")}
        />
      </Field>

      <Field label={t("bikeForm.description")}>
        <TextArea
          value={value.description}
          onChange={(event) =>
            onChange({ ...value, description: event.target.value })
          }
          maxLength={BIKE_LIMITS.maxDescriptionLength}
          placeholder={t("bikeForm.descriptionPlaceholder")}
          rows={4}
        />
      </Field>

      <Switch
        label={t("bikeForm.visible")}
        description={t("bikeForm.visibleHint")}
        isOn={value.isAvailable}
        onChange={(isAvailable) => onChange({ ...value, isAvailable })}
      />
    </>
  );
}
