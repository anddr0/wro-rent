"use client";

import { AdminReviewList } from "@/components/admin/admin-review-list";
import { PageTitle } from "@/components/page-title";
import { useT } from "@/lib/i18n/use-t";

// New reviews of all bikes: the bot's "new review" message leads here.
// Approved and hidden reviews are on the page of their bike.
export default function AdminReviewsPage() {
  const t = useT();

  return (
    <>
      <PageTitle>{t("adminReviews.pendingTitle")}</PageTitle>
      <AdminReviewList
        query="status=pending"
        showBikeName
        emptyTitle={t("adminReviews.pendingEmpty")}
        emptyHint={t("adminReviews.pendingEmptyHint")}
      />
    </>
  );
}
