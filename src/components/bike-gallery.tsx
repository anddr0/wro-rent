"use client";

import { type UIEvent, useState } from "react";
import { BikePhoto } from "@/components/bike-photo";

// The space between two photos in the strip, in pixels.
const SLIDE_GAP = 12;

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
    const firstSlide = strip.firstElementChild;
    if (!(firstSlide instanceof HTMLElement)) {
      return;
    }
    // From one photo to the next the strip scrolls by a photo and a gap.
    const step = firstSlide.offsetWidth + SLIDE_GAP;
    const index = Math.round(strip.scrollLeft / step);
    // The last photo can't reach the left edge, so it never gets a full step.
    const isAtEnd =
      strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2;
    setCurrentIndex(isAtEnd ? photoUrls.length - 1 : index);
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Each photo is a bit narrower than the screen, so the edge of the next
          one shows: it is clear there is more to swipe. -mx-4 px-4 lets the
          strip run to the screen edges, past the page padding. */}
      <div
        onScroll={handleScroll}
        style={{ gap: SLIDE_GAP }}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 [scrollbar-width:none]"
      >
        {photoUrls.map((url) => (
          <div key={url} className="w-[88%] shrink-0 snap-start">
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
