"use client";

import { Star } from "lucide-react";
import { type UIEvent, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Stars } from "@/components/reviews/stars";
import { SectionTitle } from "@/components/section";
import { useLocale, useT } from "@/lib/i18n/use-t";
import type { BikeReviews, PublicReview } from "@/lib/reviews";

// The space between two review cards, in pixels.
const CARD_GAP = 12;

// A comment longer than this is folded to a few lines with "Read more".
const LONG_COMMENT_LENGTH = 110;

// Approved reviews at the bottom of the bike's page, swiped sideways like
// the photo gallery: one card fits the screen, the edge of the next one shows.
export function ReviewCarousel({ reviews, averageRating }: BikeReviews) {
  const t = useT();
  const locale = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (reviews.length === 0 || averageRating === null) {
    return null;
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const strip = event.currentTarget;
    const firstCard = strip.firstElementChild;
    if (!(firstCard instanceof HTMLElement)) {
      return;
    }
    // From one card to the next the strip scrolls by a card and a gap.
    const step = firstCard.offsetWidth + CARD_GAP;
    const index = Math.round(strip.scrollLeft / step);
    // The last card can't reach the left edge, so it never gets a full step.
    const isAtEnd =
      strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2;
    setCurrentIndex(isAtEnd ? reviews.length - 1 : index);
  }

  // A single review takes the whole width: there is nothing to swipe to.
  const cardWidth = reviews.length === 1 ? "w-full" : "w-[88%]";

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 pr-1">
        <SectionTitle>{t("review.title")}</SectionTitle>
        <span className="flex items-center gap-1 text-sm font-semibold">
          <Star className="size-4 fill-foreground" strokeWidth={1.5} />
          {/* 4.8 in English, 4,8 in the other languages. */}
          {averageRating.toLocaleString(locale, { minimumFractionDigits: 1 })}
          <span className="font-normal text-muted-foreground">
            · {reviews.length}
          </span>
        </span>
      </div>

      {/* items-start: a card opened with "Read more" grows by itself and
          doesn't stretch its neighbours. */}
      <div
        onScroll={handleScroll}
        style={{ gap: CARD_GAP }}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 items-start overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
      >
        {reviews.map((review) => (
          <div key={review.id} className={`${cardWidth} shrink-0 snap-start`}>
            <ReviewCard review={review} />
          </div>
        ))}
      </div>

      {reviews.length > 1 && (
        <div className="flex justify-center gap-1.5" aria-hidden>
          {reviews.map((review, index) => {
            let dotColor = "bg-muted-foreground/40";
            if (index === currentIndex) {
              dotColor = "bg-foreground";
            }
            return (
              <span
                key={review.id}
                className={`size-1.5 rounded-full ${dotColor}`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

// Every card is the same height (h-48) while its text is folded; a card
// opened with "Read more" grows to fit the whole comment.
function ReviewCard({ review }: { review: PublicReview }) {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);

  const comment = review.comment ?? "";
  const isLong = comment.length > LONG_COMMENT_LENGTH;

  let commentClasses = "wrap-anywhere whitespace-pre-line";
  if (isLong && !isOpen) {
    commentClasses = "line-clamp-3 wrap-anywhere";
  }

  let heightClass = "h-48";
  if (isOpen) {
    heightClass = "min-h-48";
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm ${heightClass}`}
    >
      <div className="flex items-center gap-3">
        <Avatar
          photoUrl={review.authorPhotoUrl}
          name={review.authorName}
          size={40}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate font-medium">{review.authorName}</span>
          <Stars rating={review.rating} />
        </div>
      </div>

      {comment !== "" && <p className={commentClasses}>{comment}</p>}

      {isLong && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="mt-auto self-start text-sm font-semibold"
        >
          {isOpen ? t("review.readLess") : t("review.readMore")}
        </button>
      )}
    </div>
  );
}
