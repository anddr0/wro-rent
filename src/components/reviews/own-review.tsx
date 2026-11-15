"use client";

import { Stars } from "@/components/reviews/stars";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";
import type { OwnReview, ReviewStatus } from "@/lib/reviews";

const STATUS_LABELS: Record<ReviewStatus, MessageKey> = {
  pending: "review.ownPending",
  approved: "review.ownApproved",
  hidden: "review.ownHidden",
};

// The review the customer already left, in the card of their booking.
export function OwnReviewCard({ review }: { review: OwnReview }) {
  const t = useT();

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{t("review.yours")}</span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {t(STATUS_LABELS[review.status])}
        </span>
      </div>
      <Stars rating={review.rating} />
      {review.comment && (
        <p className="wrap-anywhere whitespace-pre-line">{review.comment}</p>
      )}
    </div>
  );
}
