"use client";

import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminReviewList } from "@/components/admin/admin-review-list";
import { BikeFieldsInputs } from "@/components/admin/bike-fields";
import { BikePhotosEditor } from "@/components/admin/bike-photos-editor";
import { BikeUnavailability } from "@/components/admin/bike-unavailability";
import { HiddenBadge } from "@/components/admin/hidden-badge";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { ErrorState } from "@/components/error-state";
import { FormError } from "@/components/form-error";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { SectionTitle } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import { BIKE_LIMITS } from "@/lib/admin-bikes";
import type { AdminBikeDetails, AdminBikeResponse } from "@/lib/admin-bikes";
import { apiErrorCode, apiFetch, apiSendJson } from "@/lib/api";
import { setBackGuard } from "@/lib/back-guard";
import { buildSaveForm, draftFromBike, isDraftChanged } from "@/lib/bike-draft";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";
import { refreshBikes } from "@/lib/refresh-bikes";
import { confirmInTelegram } from "@/lib/telegram/dialogs";
import { useTelegram } from "@/lib/telegram/use-telegram";
import { isNotFound, useApi } from "@/lib/use-api";

export default function AdminBikePage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { data, error, mutate } = useApi<AdminBikeResponse>(
    `/api/admin/bikes/${id}`,
  );

  if (isNotFound(error)) {
    return <NotFoundText>{t("common.bikeNotFound")}</NotFoundText>;
  }
  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  return <BikeEditor bike={data.bike} />;
}

// Everything an admin can do with one bike (А-3, А-4, А-5). Every change
// stays a draft until "Save"; only archiving and deleting act at once.
function BikeEditor({ bike }: { bike: AdminBikeDetails }) {
  const t = useT();
  const router = useRouter();
  const { webApp } = useTelegram();
  // The bike as it was when the page opened, and the draft of changes.
  const [saved] = useState(() => draftFromBike(bike));
  const [draft, setDraft] = useState(saved);
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorKey, setSaveErrorKey] = useState<MessageKey | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const bikePath = `/api/admin/bikes/${bike.id}`;
  const isChanged = isDraftChanged(draft, saved);

  // Telegram's "back" asks first while there are unsaved changes.
  useEffect(() => {
    if (!isChanged) {
      return;
    }
    setBackGuard(() => confirmInTelegram(webApp, t("bikeForm.leaveConfirm")));
    return () => setBackGuard(null);
  }, [isChanged, webApp, t]);

  async function saveChanges() {
    if (draft.fields.name.trim() === "") {
      setSaveErrorKey("bikeForm.nameRequired");
      return;
    }

    setIsSaving(true);
    setSaveErrorKey(null);
    try {
      await apiFetch<AdminBikeResponse>(bikePath, {
        method: "PATCH",
        body: buildSaveForm(draft, saved),
      });
      await refreshBikes();
      // Saved: leaving is fine now.
      setBackGuard(null);
      router.back();
    } catch (error) {
      console.error(error);
      const code = apiErrorCode(error);
      if (code === "too_many_photos") {
        setSaveErrorKey("bikeForm.tooManyPhotos");
      } else if (code === "bad_photo") {
        setSaveErrorKey("bikeForm.badPhoto");
      } else {
        setSaveErrorKey("common.saveFailed");
      }
    } finally {
      setIsSaving(false);
    }
  }

  // Archiving, restoring and deleting act at once and share the "busy" and
  // "failed" states. `question` is asked first when it's hard to take back.
  async function runAction(
    question: string | null,
    action: () => Promise<unknown>,
  ) {
    if (question !== null) {
      const isConfirmed = await confirmInTelegram(webApp, question);
      if (!isConfirmed) {
        return;
      }
    }

    setIsBusy(true);
    setHasFailed(false);
    try {
      await action();
      await refreshBikes();
      setBackGuard(null);
      router.back();
    } catch (error) {
      console.error(error);
      setHasFailed(true);
      // E.g. the bike got a booking meanwhile and can't be deleted any more.
      await refreshBikes();
    } finally {
      setIsBusy(false);
    }
  }

  function archiveBike() {
    return runAction(t("adminBike.archiveConfirm"), () =>
      apiSendJson("POST", `${bikePath}/archive`, { isArchived: true }),
    );
  }

  function restoreBike() {
    return runAction(null, () =>
      apiSendJson("POST", `${bikePath}/archive`, { isArchived: false }),
    );
  }

  function deleteBike() {
    return runAction(t("adminBike.deleteConfirm"), () =>
      apiSendJson("DELETE", bikePath),
    );
  }

  return (
    <>
      <PageTitle
        end={bike.isArchived && <HiddenBadge label={t("adminBike.archived")} />}
      >
        {bike.name}
      </PageTitle>

      <BikePhotosEditor
        photos={draft.photos}
        onChange={(photos) => setDraft({ ...draft, photos })}
      />

      <BikeFieldsInputs
        value={draft.fields}
        onChange={(fields) => setDraft({ ...draft, fields })}
      />

      <BikeUnavailability
        bikeId={bike.id}
        periods={draft.periods}
        onPeriodsChange={(periods) => setDraft({ ...draft, periods })}
        isPaused={draft.isPaused}
        onPausedChange={(isPaused) => setDraft({ ...draft, isPaused })}
      />

      {/* Reviews are the customers', not part of the bike: approving or
          hiding one acts at once, like on the "Reviews to check" page. */}
      <section className="flex flex-col gap-2">
        <SectionTitle>{t("review.title")}</SectionTitle>
        <AdminReviewList
          query={`bikeId=${bike.id}`}
          showBikeName={false}
          emptyTitle={t("adminReviews.bikeEmpty")}
        />
      </section>

      <div className="flex flex-col gap-1">
        {bike.isArchived ? (
          <Button variant="secondary" disabled={isBusy} onClick={restoreBike}>
            <ArchiveRestore />
            {t("adminBike.restore")}
          </Button>
        ) : (
          <Button
            variant="destructiveText"
            disabled={isBusy}
            onClick={archiveBike}
          >
            <Archive />
            {t("adminBike.toArchive")}
          </Button>
        )}

        {bike.hasBookings ? (
          <p className="px-1 text-center text-sm text-muted-foreground">
            {t("adminBike.hasBookingsHint")}
          </p>
        ) : (
          <Button
            variant="destructiveText"
            disabled={isBusy}
            onClick={deleteBike}
          >
            <Trash2 />
            {t("adminBike.delete")}
          </Button>
        )}

        {hasFailed && <FormError>{t("adminBike.actionFailed")}</FormError>}
      </div>

      <BottomBar>
        {saveErrorKey !== null && (
          <FormError>
            {t(saveErrorKey, { count: BIKE_LIMITS.maxPhotos })}
          </FormError>
        )}
        {isChanged && saveErrorKey === null && (
          <p className="text-center text-sm text-muted-foreground">
            {t("bikeForm.unsaved")}
          </p>
        )}
        <Button onClick={saveChanges} disabled={isSaving || !isChanged}>
          {t("common.save")}
        </Button>
      </BottomBar>
    </>
  );
}
