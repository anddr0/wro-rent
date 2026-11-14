"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Field, TextInput } from "@/components/form";
import { FormError } from "@/components/form-error";
import { SectionTitle } from "@/components/section";
import { Switch } from "@/components/switch";
import { PLAN_LIMITS } from "@/lib/admin-plans";
import type { PlanFields } from "@/lib/admin-plans";
import { parseAmount } from "@/lib/amounts";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";
import { DURATION_UNITS } from "@/lib/plans";
import type { DurationUnit } from "@/lib/plans";
import { refreshApi } from "@/lib/use-api";

const UNIT_LABELS: Record<DurationUnit, MessageKey> = {
  hour: "planForm.unitHour",
  day: "planForm.unitDay",
  week: "planForm.unitWeek",
  month: "planForm.unitMonth",
};

type PlanFormProps = {
  // What the fields start with. Null — a new plan, the fields are empty.
  initialFields: PlanFields | null;
  submitLabel: string;
  // Sends the plan to the server. Throws when saving failed.
  onSubmit: (fields: PlanFields) => Promise<unknown>;
};

// The fields of a rental plan with the button that saves them (А-10, А-11).
export function PlanForm({
  initialFields,
  submitLabel,
  onSubmit,
}: PlanFormProps) {
  const t = useT();
  const router = useRouter();

  // Numbers are kept as typed text and checked on save.
  const [name, setName] = useState(initialFields?.name ?? "");
  const [durationCount, setDurationCount] = useState(
    String(initialFields?.durationCount ?? 1),
  );
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(
    initialFields?.durationUnit ?? "day",
  );
  const [price, setPrice] = useState(
    initialFields ? String(initialFields.price) : "",
  );
  const [isActive, setIsActive] = useState(initialFields?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  async function submit() {
    if (name.trim() === "") {
      setErrorKey("planForm.nameRequired");
      return;
    }

    const count = Number(durationCount.trim());
    const isCountValid =
      Number.isInteger(count) &&
      count >= 1 &&
      count <= PLAN_LIMITS.maxDurationCount;
    if (!isCountValid) {
      setErrorKey("planForm.durationInvalid");
      return;
    }

    const newPrice = parseAmount(price);
    if (newPrice === null) {
      setErrorKey("planForm.priceInvalid");
      return;
    }

    setIsSaving(true);
    setErrorKey(null);
    try {
      await onSubmit({
        name: name.trim(),
        durationCount: count,
        durationUnit,
        price: newPrice,
        isActive,
      });
      // The admin's list, and the plans customers see next to the bikes.
      await refreshApi("/api/admin/plans");
      await refreshApi("/api/bikes");
      router.back();
    } catch (error) {
      console.error(error);
      setErrorKey("common.saveFailed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Field label={t("planForm.name")}>
        <TextInput
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={PLAN_LIMITS.maxNameLength}
          placeholder={t("planForm.namePlaceholder")}
        />
      </Field>

      <section className="flex flex-col gap-2">
        <SectionTitle>{t("planForm.duration")}</SectionTitle>
        <TextInput
          inputMode="numeric"
          value={durationCount}
          onChange={(event) => setDurationCount(event.target.value)}
          aria-label={t("planForm.duration")}
        />
        <div className="flex flex-wrap gap-2">
          {DURATION_UNITS.map((unit) => (
            <Chip
              key={unit}
              label={t(UNIT_LABELS[unit])}
              isSelected={unit === durationUnit}
              onSelect={() => setDurationUnit(unit)}
            />
          ))}
        </div>
      </section>

      <Field label={t("planForm.price")}>
        <TextInput
          inputMode="decimal"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="50"
        />
      </Field>

      <Switch
        label={t("planForm.active")}
        description={t("planForm.activeHint")}
        isOn={isActive}
        onChange={setIsActive}
      />

      <BottomBar>
        {errorKey !== null && (
          <FormError>
            {t(errorKey, { count: PLAN_LIMITS.maxDurationCount })}
          </FormError>
        )}
        <Button onClick={submit} disabled={isSaving}>
          {submitLabel}
        </Button>
      </BottomBar>
    </>
  );
}
