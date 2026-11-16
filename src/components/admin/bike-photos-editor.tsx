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
import { draftKey } from "@/lib/bike-draft";
import type { DraftPhoto } from "@/lib/bike-draft";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";
import { resizeImage } from "@/lib/resize-image";

type BikePhotosEditorProps = {
  photos: DraftPhoto[];
  onChange: (photos: DraftPhoto[]) => void;
};

// The bike's photos (А-3): add, delete, move. Every change stays in the
// page's draft; nothing is uploaded or deleted until "Save".
export function BikePhotosEditor({ photos, onChange }: BikePhotosEditorProps) {
  const t = useT();
  const fileInput = useRef<HTMLInputElement>(null);
  // A picked photo is being shrunk in the browser.
  const [isResizing, setIsResizing] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const canAddMore = photos.length < BIKE_LIMITS.maxPhotos;

  async function addPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear the input, so picking the same file again fires "change" again.
    event.target.value = "";
    if (!file) {
      return;
    }

    setIsResizing(true);
    setErrorKey(null);
    try {
      const resized = await resizeImage(file, BIKE_LIMITS.maxPhotoSide);
      const newPhoto: DraftPhoto = {
        kind: "new",
        key: crypto.randomUUID(),
        file: resized,
        url: URL.createObjectURL(resized),
      };
      onChange([...photos, newPhoto]);
    } catch (error) {
      // Not an image the browser can read.
      console.error(error);
      setErrorKey("bikeForm.badPhoto");
    } finally {
      setIsResizing(false);
    }
  }

  function deletePhoto(index: number) {
    const photo = photos[index];
    if (photo.kind === "new") {
      // The picked file is no longer needed in the browser's memory.
      URL.revokeObjectURL(photo.url);
    }
    onChange(photos.filter((item, itemIndex) => itemIndex !== index));
  }

  // Swaps the photo with its neighbour: -1 moves it left, +1 right.
  function movePhoto(index: number, step: -1 | 1) {
    const reordered = [...photos];
    reordered[index] = photos[index + step];
    reordered[index + step] = photos[index];
    onChange(reordered);
  }

  return (
    <section className="flex flex-col gap-2">
      <span className="text-sm font-medium">{t("bikeForm.photos")}</span>

      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo, index) => (
          <div key={draftKey(photo)} className="flex flex-col gap-1.5">
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
                  isDisabled={index === 0}
                  onClick={() => movePhoto(index, -1)}
                />
                <PhotoButton
                  icon={ChevronRight}
                  label={t("bikeForm.moveRight")}
                  isDisabled={index === photos.length - 1}
                  onClick={() => movePhoto(index, 1)}
                />
              </div>
              <PhotoButton
                icon={Trash2}
                label={t("bikeForm.deletePhoto")}
                isDisabled={false}
                onClick={() => deletePhoto(index)}
              />
            </div>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            aria-label={t("bikeForm.addPhoto")}
            disabled={isResizing}
            onClick={() => fileInput.current?.click()}
            className="flex aspect-4/3 items-center justify-center rounded-lg border border-dashed text-muted-foreground transition-opacity active:opacity-70 disabled:opacity-50"
          >
            {isResizing ? (
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
        onChange={addPhoto}
        className="hidden"
      />

      {errorKey !== null && <FormError>{t(errorKey)}</FormError>}
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
