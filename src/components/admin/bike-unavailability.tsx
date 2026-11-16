"use client";

import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ButtonLink } from "@/components/button";
import { ErrorState } from "@/components/error-state";
import { FormError } from "@/components/form-error";
import { Row, Section, SectionTitle } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import { Switch } from "@/components/switch";
import { apiSendJson } from "@/lib/api";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { describePeriod } from "@/lib/unavailable";
import type {
  UnavailablePeriod,
  UnavailablePeriodsResponse,
} from "@/lib/unavailable";
import { confirmInTelegram } from "@/lib/telegram/dialogs";
import { useTelegram } from "@/lib/telegram/use-telegram";
import { refreshApi, useApi } from "@/lib/use-api";

// "Unavailable" on the bike's page: the times an admin closed the bike for
// by hand (repair and the like), with a way to add and to remove them.
type BikeUnavailabilityProps = {
  bikeId: string;
  // "Temporarily unavailable" is on.
  isPaused: boolean;
};

export function BikeUnavailability({
  bikeId,
  isPaused,
}: BikeUnavailabilityProps) {
  const t = useT();
  const { webApp } = useTelegram();
  const path = `/api/admin/bikes/${bikeId}/unavailable`;
  const { data, error, mutate } = useApi<UnavailablePeriodsResponse>(path);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  async function deletePeriod(period: UnavailablePeriod) {
    if (isDeleting) {
      return;
    }
    const isConfirmed = await confirmInTelegram(
      webApp,
      t("unavailable.deleteConfirm"),
    );
    if (!isConfirmed) {
      return;
    }

    setIsDeleting(true);
    setHasFailed(false);
    try {
      await apiSendJson("DELETE", `${path}/${period.id}`);
    } catch (deleteError) {
      console.error(deleteError);
      setHasFailed(true);
    } finally {
      // This list and the calendar customers see for this bike.
      await mutate();
      await refreshApi(`/api/bikes/${bikeId}`);
      setIsDeleting(false);
    }
  }

  let list = <Skeleton className="h-14 rounded-xl" />;
  if (data) {
    list = <PeriodList periods={data.periods} onDelete={deletePeriod} />;
  } else if (error) {
    list = <ErrorState onRetry={() => mutate()} />;
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>{t("unavailable.title")}</SectionTitle>
      {list}
      {hasFailed && <FormError>{t("adminBike.actionFailed")}</FormError>}
      <ButtonLink
        href={`/admin/bikes/${bikeId}/unavailable/new`}
        variant="secondary"
      >
        <Plus />
        {t("unavailable.add")}
      </ButtonLink>

      <PauseSwitch bikeId={bikeId} isPaused={isPaused} />
    </section>
  );
}

type PeriodListProps = {
  periods: UnavailablePeriod[];
  onDelete: (period: UnavailablePeriod) => void;
};

function PeriodList({ periods, onDelete }: PeriodListProps) {
  const t = useT();
  const locale = useLocale();

  if (periods.length === 0) {
    return (
      <p className="px-1 text-sm text-muted-foreground">
        {t("unavailable.empty")}
      </p>
    );
  }

  return (
    <Section>
      {periods.map((period) => {
        const label = describePeriod(period, locale);
        return (
          <Row
            key={period.id}
            icon={CalendarOff}
            title={label.text}
            subtitle={
              label.isWholeDays ? t("unavailable.wholeDays") : undefined
            }
            end={
              <button
                type="button"
                aria-label={t("unavailable.delete")}
                onClick={() => onDelete(period)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-muted"
              >
                <Trash2 className="size-[18px]" />
              </button>
            }
          />
        );
      })}
    </Section>
  );
}

type PauseSwitchProps = {
  bikeId: string;
  isPaused: boolean;
};

// "Temporarily unavailable": for a bike that is out for an unknown time.
// Saved at once, like the periods above, without the page's "Save" button.
function PauseSwitch({ bikeId, isPaused }: PauseSwitchProps) {
  const t = useT();
  const [isSaving, setIsSaving] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  async function setPaused(newIsPaused: boolean) {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    setHasFailed(false);
    try {
      await apiSendJson("POST", `/api/admin/bikes/${bikeId}/pause`, {
        isPaused: newIsPaused,
      });
    } catch (error) {
      console.error(error);
      setHasFailed(true);
    } finally {
      // This page, the admin's list and the catalog customers see.
      await refreshApi("/api/admin/bikes");
      await refreshApi("/api/bikes");
      setIsSaving(false);
    }
  }

  return (
    <>
      <Switch
        label={t("pause.title")}
        description={t("pause.hint")}
        isOn={isPaused}
        onChange={setPaused}
      />
      {hasFailed && <FormError>{t("adminBike.actionFailed")}</FormError>}
    </>
  );
}
