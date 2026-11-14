"use client";

import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { BikeForm } from "@/components/admin/bike-form";
import { BikePhotosEditor } from "@/components/admin/bike-photos-editor";
import { HiddenBadge } from "@/components/admin/hidden-badge";
import { Button } from "@/components/button";
import { ErrorState } from "@/components/error-state";
import { FormError } from "@/components/form-error";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { Skeleton } from "@/components/skeleton";
import type {
  AdminBikeDetails,
  AdminBikeResponse,
  BikeFields,
} from "@/lib/admin-bikes";
import { apiSendJson } from "@/lib/api";
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

// Everything an admin can do with one bike (А-3, А-4, А-5).
function BikeEditor({ bike }: { bike: AdminBikeDetails }) {
  const t = useT();
  const router = useRouter();
  const { webApp } = useTelegram();
  const [isBusy, setIsBusy] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const bikePath = `/api/admin/bikes/${bike.id}`;

  async function saveBike(fields: BikeFields) {
    await apiSendJson<AdminBikeResponse>("PATCH", bikePath, fields);
    await refreshBikes();
    router.back();
  }

  // Archiving, restoring and deleting share the "busy" and "failed" states.
  // `question` is asked first when the action is hard to take back.
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
        bikeId={bike.id}
        photos={bike.photos}
        onChanged={refreshBikes}
      />

      <div className="flex flex-col gap-2">
        {bike.isArchived ? (
          <Button variant="secondary" disabled={isBusy} onClick={restoreBike}>
            <ArchiveRestore />
            {t("adminBike.restore")}
          </Button>
        ) : (
          <Button variant="secondary" disabled={isBusy} onClick={archiveBike}>
            <Archive />
            {t("adminBike.toArchive")}
          </Button>
        )}

        {bike.hasBookings ? (
          <p className="px-1 text-sm text-muted-foreground">
            {t("adminBike.hasBookingsHint")}
          </p>
        ) : (
          <Button variant="destructive" disabled={isBusy} onClick={deleteBike}>
            <Trash2 />
            {t("adminBike.delete")}
          </Button>
        )}

        {hasFailed && <FormError>{t("adminBike.actionFailed")}</FormError>}
      </div>

      {/* Last: the form ends with the pinned "Save" button. */}
      <BikeForm
        initialFields={{
          name: bike.name,
          description: bike.description ?? "",
          isAvailable: bike.isAvailable,
        }}
        submitLabel={t("common.save")}
        onSubmit={saveBike}
      />
    </>
  );
}
