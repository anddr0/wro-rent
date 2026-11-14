"use client";

import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { BikePhoto } from "@/components/bike-photo";
import { FormError } from "@/components/form-error";
import { BIKE_LIMITS } from "@/lib/admin-bikes";
import type { AdminBikeResponse, BikePhotoItem } from "@/lib/admin-bikes";
import { apiErrorCode, apiFetch, apiSendJson } from "@/lib/api";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";
import { resizeImage } from "@/lib/resize-image";
import { confirmInTelegram } from "@/lib/telegram/dialogs";
import { useTelegram } from "@/lib/telegram/use-telegram";

type BikePhotosEditorProps = {
  bikeId: string;
  photos: BikePhotoItem[];
  // Called after every change on the server, so the page reloads the bike.
  onChanged: () => Promise<unknown>;
};

// The bike's photos (А-3): add, delete, move. Every change is saved at once,
// without the "Save" button of the form below.
export function BikePhotosEditor({
  bikeId,
  photos,
  onChanged,
}: BikePhotosEditorProps) {
  const t = useT();
  const { webApp } = useTelegram();
  const fileInput = useRef<HTMLInputElement>(null);
  // One change at a time: the buttons wait while it is being saved.
  const [isBusy, setIsBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const photosPath = `/api/admin/bikes/${bikeId}/photos`;
  const canAddMore = photos.length < BIKE_LIMITS.maxPhotos;

  // Runs one change and reloads the bike, whatever the outcome.
  async function change(action: () => Promise<unknown>) {
    setIsBusy(true);
    setErrorKey(null);
    try {
      await action();
    } catch (error) {
      console.error(error);
      const code = apiErrorCode(error);
      if (code === "too_many_photos") {
        setErrorKey("bikeForm.tooManyPhotos");
      } else if (code === "bad_photo") {
        setErrorKey("bikeForm.badPhoto");
      } else {
        setErrorKey("bikeForm.photoFailed");
      }
    } finally {
      await onChanged();
      setIsBusy(false);
    }
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear the input, so picking the same file again fires "change" again.
    event.target.value = "";
    if (!file) {
      return;
    }

    await change(async () => {
      const resized = await resizeImage(file, BIKE_LIMITS.maxPhotoSide);
      const form = new FormData();
      form.set("photo", resized, "photo.jpg");
      await apiFetch<AdminBikeResponse>(photosPath, {
        method: "POST",
        body: form,
      });
    });
  }

  async function deletePhoto(photo: BikePhotoItem) {
    const isConfirmed = await confirmInTelegram(
      webApp,
      t("bikeForm.deletePhotoConfirm"),
    );
    if (!isConfirmed) {
      return;
    }
    await change(() =>
      apiSendJson<AdminBikeResponse>("DELETE", `${photosPath}/${photo.id}`),
    );
  }

  // Swaps the photo with its neighbour: -1 moves it left, +1 right.
  async function movePhoto(index: number, step: -1 | 1) {
    const photoIds = photos.map((photo) => photo.id);
    const movedId = photoIds[index];
    photoIds[index] = photoIds[index + step];
    photoIds[index + step] = movedId;

    await change(() =>
      apiSendJson<AdminBikeResponse>("PUT", photosPath, { photoIds }),
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <span className="text-sm font-medium">{t("bikeForm.photos")}</span>

      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo, index) => (
          <div key={photo.id} className="flex flex-col gap-1.5">
            <div className="relative">
              <BikePhoto size="medium" url={photo.url} />
              {index === 0 && (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">
                  {t("bikeForm.cover")}
                </span>
              )}
            </div>
            <div className="flex justify-between">
              <div className="flex gap-1.5">
                <PhotoButton
                  icon={ChevronLeft}
                  label={t("bikeForm.moveLeft")}
                  isDisabled={isBusy || index === 0}
                  onClick={() => movePhoto(index, -1)}
                />
                <PhotoButton
                  icon={ChevronRight}
                  label={t("bikeForm.moveRight")}
                  isDisabled={isBusy || index === photos.length - 1}
                  onClick={() => movePhoto(index, 1)}
                />
              </div>
              <PhotoButton
                icon={Trash2}
                label={t("bikeForm.deletePhoto")}
                isDisabled={isBusy}
                onClick={() => deletePhoto(photo)}
              />
            </div>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            aria-label={t("bikeForm.addPhoto")}
            disabled={isBusy}
            onClick={() => fileInput.current?.click()}
            className="flex aspect-4/3 items-center justify-center rounded-lg border border-dashed text-muted-foreground transition-opacity active:opacity-70 disabled:opacity-50"
          >
            {isBusy ? (
              <LoaderCircle className="size-6 animate-spin" />
            ) : (
              <ImagePlus className="size-6" strokeWidth={1.5} />
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        onChange={uploadPhoto}
        className="hidden"
      />

      {errorKey !== null && (
        <FormError>{t(errorKey, { count: BIKE_LIMITS.maxPhotos })}</FormError>
      )}
      <p className="text-sm text-muted-foreground">
        {t("bikeForm.photosHint")}
      </p>
    </section>
  );
}

type PhotoButtonProps = {
  icon: typeof Trash2;
  // For screen readers: the button shows only an icon.
  label: string;
  isDisabled: boolean;
  onClick: () => void;
};

function PhotoButton({
  icon: Icon,
  label,
  isDisabled,
  onClick,
}: PhotoButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={isDisabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-lg bg-muted transition-opacity active:opacity-70 disabled:opacity-30"
    >
      <Icon className="size-[18px]" />
    </button>
  );
}
