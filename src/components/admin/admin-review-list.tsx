"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { FormError } from "@/components/form-error";
import { Stars } from "@/components/reviews/stars";
import { Skeleton } from "@/components/skeleton";
import { apiSendJson } from "@/lib/api";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";
import type {
  AdminReview,
  AdminReviewResponse,
  AdminReviewsResponse,
  ReviewStatus,
} from "@/lib/reviews";
import { refreshApi, useApi } from "@/lib/use-api";

const STATUS_LABELS: Record<ReviewStatus, MessageKey> = {
  pending: "adminReviews.statusPending",
  approved: "adminReviews.statusApproved",
  hidden: "adminReviews.statusHidden",
};

const STATUS_CLASSES: Record<ReviewStatus, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  hidden: "bg-muted text-muted-foreground",
};

type AdminReviewListProps = {
  // Which reviews to load: "status=pending" or "bikeId=<id>".
  query: string;
  // Reviews of all bikes are listed together, so each shows its bike.
  showBikeName: boolean;
  emptyTitle: string;
  emptyHint?: string;
};

// Reviews with the buttons to approve or hide each one.
export function AdminReviewList({
  query,
  showBikeName,
  emptyTitle,
  emptyHint,
}: AdminReviewListProps) {
  const { data, error, mutate } = useApi<AdminReviewsResponse>(
    `/api/admin/reviews?${query}`,
  );

  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return <Skeleton className="h-32 rounded-xl" />;
  }
  if (data.reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title={emptyTitle}
        description={emptyHint}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.reviews.map((review) => (
        <AdminReviewCard
          key={review.id}
          review={review}
          showBikeName={showBikeName}
        />
      ))}
    </div>
  );
}

type AdminReviewCardProps = {
  review: AdminReview;
  showBikeName: boolean;
};

function AdminReviewCard({ review, showBikeName }: AdminReviewCardProps) {
  const t = useT();
  const [isSaving, setIsSaving] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  async function setStatus(status: "approved" | "hidden") {
    setIsSaving(true);
    setHasFailed(false);
    try {
      await apiSendJson<AdminReviewResponse>(
        "PATCH",
        `/api/admin/reviews/${review.id}`,
        { status },
      );
    } catch (error) {
      console.error(error);
      setHasFailed(true);
    } finally {
      // The lists of reviews, the counter on the admin's home page
      // and the bike's page customers see.
      await refreshApi("/api/admin");
      await refreshApi(`/api/bikes/${review.bike.id}`);
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium wrap-anywhere">{review.authorName}</span>
          {showBikeName && (
            <span className="text-sm text-muted-foreground wrap-anywhere">
              {review.bike.name}
            </span>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[review.status]}`}
        >
          {t(STATUS_LABELS[review.status])}
        </span>
      </div>

      <Stars rating={review.rating} />
      {review.comment && (
        <p className="wrap-anywhere whitespace-pre-line">{review.comment}</p>
      )}

      {hasFailed && <FormError>{t("adminReviews.failed")}</FormError>}

      <ReviewActions
        status={review.status}
        isSaving={isSaving}
        onSetStatus={setStatus}
      />
    </div>
  );
}

type ReviewActionsProps = {
  status: ReviewStatus;
  isSaving: boolean;
  onSetStatus: (status: "approved" | "hidden") => void;
};

// A new review can go either way; a decided one can only be switched over.
function ReviewActions({ status, isSaving, onSetStatus }: ReviewActionsProps) {
  const t = useT();

  const hideButton = (
    <Button
      variant="secondary"
      size="small"
      disabled={isSaving}
      onClick={() => onSetStatus("hidden")}
    >
      {t("adminReviews.hide")}
    </Button>
  );

  if (status === "pending") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {hideButton}
        <Button
          size="small"
          disabled={isSaving}
          onClick={() => onSetStatus("approved")}
        >
          {t("adminReviews.approve")}
        </Button>
      </div>
    );
  }
  if (status === "approved") {
    return hideButton;
  }
  return (
    <Button
      variant="secondary"
      size="small"
      disabled={isSaving}
      onClick={() => onSetStatus("approved")}
    >
      {t("adminReviews.show")}
    </Button>
  );
}
