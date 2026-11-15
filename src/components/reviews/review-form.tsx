"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { TextArea } from "@/components/form";
import { FormError } from "@/components/form-error";
import { StarPicker } from "@/components/reviews/stars";
import { apiSendJson } from "@/lib/api";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";
import { REVIEW_RULES } from "@/lib/reviews";
import type { NewReviewRequest, OwnReviewResponse } from "@/lib/reviews";

type ReviewFormProps = {
  bookingId: string;
  // Called after the review is saved, so the page reloads the booking.
  onSent: () => Promise<unknown>;
};

// "How was the bike?" in the card of a completed booking:
// a rating and an optional comment.
export function ReviewForm({ bookingId, onSent }: ReviewFormProps) {
  const t = useT();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  async function sendReview() {
    if (rating === 0) {
      setErrorKey("review.ratingRequired");
      return;
    }

    const request: NewReviewRequest = { rating, comment };

    setIsSending(true);
    setErrorKey(null);
    try {
      await apiSendJson<OwnReviewResponse>(
        "POST",
        `/api/bookings/${bookingId}/review`,
        request,
      );
    } catch (error) {
      console.error(error);
      setErrorKey("review.sendFailed");
    } finally {
      // Also after an error: maybe the review was sent from another device.
      await onSent();
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <span className="font-semibold">{t("review.formTitle")}</span>
      <StarPicker rating={rating} onChange={setRating} />
      <TextArea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={REVIEW_RULES.maxCommentLength}
        placeholder={t("review.commentPlaceholder")}
        rows={3}
      />
      <span className="text-sm text-muted-foreground">
        {t("review.moderationHint")}
      </span>
      {errorKey !== null && <FormError>{t(errorKey)}</FormError>}
      <Button onClick={sendReview} disabled={isSending}>
        {t("review.submit")}
      </Button>
    </div>
  );
}
