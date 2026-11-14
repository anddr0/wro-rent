"use client";

import { type UIEvent, useState } from "react";
import { BikePhoto } from "@/components/bike-photo";

type BikeGalleryProps = {
  photoUrls: string[];
};

// The bike's photos, swiped sideways. CSS scroll snapping does the swiping,
// so it feels native and needs no library. Dots show which photo is open.
export function BikeGallery({ photoUrls }: BikeGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (photoUrls.length <= 1) {
    return <BikePhoto size="large" url={photoUrls[0] ?? null} />;
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const strip = event.currentTarget;
    // Every photo is as wide as the strip.
    setCurrentIndex(Math.round(strip.scrollLeft / strip.clientWidth));
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-xl [scrollbar-width:none]"
      >
        {photoUrls.map((url) => (
          <div key={url} className="w-full shrink-0 snap-center">
            <BikePhoto size="large" url={url} />
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-1.5" aria-hidden>
        {photoUrls.map((url, index) => {
          let dotColor = "bg-muted-foreground/40";
          if (index === currentIndex) {
            dotColor = "bg-foreground";
          }
          return (
            <span key={url} className={`size-1.5 rounded-full ${dotColor}`} />
          );
        })}
      </div>
    </div>
  );
}
