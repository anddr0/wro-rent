"use client";

import { useState } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { Field, TextArea, TextInput } from "@/components/form";
import { FormError } from "@/components/form-error";
import { Switch } from "@/components/switch";
import { BIKE_LIMITS } from "@/lib/admin-bikes";
import type { BikeFields } from "@/lib/admin-bikes";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";

type BikeFormProps = {
  // What the fields start with: the bike's values, or empty for a new bike.
  initialFields: BikeFields;
  submitLabel: string;
  // Saves the bike. Throws when saving failed: the form shows the error.
  onSubmit: (fields: BikeFields) => Promise<void>;
};

// The text fields of a bike with the button that saves them (А-2, А-3).
// Photos are edited separately, see BikePhotosEditor.
export function BikeForm({
  initialFields,
  submitLabel,
  onSubmit,
}: BikeFormProps) {
  const t = useT();
  const [name, setName] = useState(initialFields.name);
  const [description, setDescription] = useState(initialFields.description);
  const [isAvailable, setIsAvailable] = useState(initialFields.isAvailable);
  const [isSaving, setIsSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  async function submit() {
    if (name.trim() === "") {
      setErrorKey("bikeForm.nameRequired");
      return;
    }

    setIsSaving(true);
    setErrorKey(null);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        isAvailable,
      });
    } catch (error) {
      console.error(error);
      setErrorKey("common.saveFailed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Field label={t("bikeForm.name")}>
        <TextInput
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={BIKE_LIMITS.maxNameLength}
          placeholder={t("bikeForm.namePlaceholder")}
        />
      </Field>

      <Field label={t("bikeForm.description")}>
        <TextArea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={BIKE_LIMITS.maxDescriptionLength}
          placeholder={t("bikeForm.descriptionPlaceholder")}
          rows={4}
        />
      </Field>

      <Switch
        label={t("bikeForm.visible")}
        description={t("bikeForm.visibleHint")}
        isOn={isAvailable}
        onChange={setIsAvailable}
      />

      <BottomBar>
        {errorKey !== null && <FormError>{t(errorKey)}</FormError>}
        <Button onClick={submit} disabled={isSaving}>
          {submitLabel}
        </Button>
      </BottomBar>
    </>
  );
}
