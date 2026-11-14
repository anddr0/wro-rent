"use client";

import { Bike } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type BikePhotoProps = {
  size: "small" | "medium" | "large";
  // TODO(blocks 3–5): pass it on the screens that still use demo data.
  url?: string | null;
};

const BOX_CLASSES: Record<BikePhotoProps["size"], string> = {
  small: "size-10 rounded-lg",
  medium: "aspect-4/3 w-full rounded-lg",
  large: "aspect-4/3 w-full rounded-xl",
};

const ICON_CLASSES: Record<BikePhotoProps["size"], string> = {
  small: "size-5",
  medium: "size-10",
  large: "size-16",
};

// The bike's photo, cropped to the box. A bike icon when there is no photo
// or it failed to load.
export function BikePhoto({ size, url = null }: BikePhotoProps) {
  // The url that failed, not a flag: a new url gets a new try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const boxClasses = `relative flex shrink-0 items-center justify-center overflow-hidden bg-muted text-muted-foreground ${BOX_CLASSES[size]}`;

  if (!url || url === failedUrl) {
    return (
      <div className={boxClasses}>
        <Bike className={ICON_CLASSES[size]} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className={boxClasses}>
      {/* unoptimized: photos are resized on upload (slice 5.3), and Vercel's
          image optimization has a monthly limit on the free plan. */}
      <Image
        src={url}
        alt=""
        fill
        unoptimized
        className="object-cover"
        onError={() => setFailedUrl(url)}
      />
    </div>
  );
}
