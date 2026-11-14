"use client";

import { SettingsForm } from "@/components/admin/settings-form";
import { ErrorState } from "@/components/error-state";
import { PageTitle } from "@/components/page-title";
import { Skeleton } from "@/components/skeleton";
import { useT } from "@/lib/i18n/use-t";
import type { AdminSettingsResponse } from "@/lib/settings";
import { useApi } from "@/lib/use-api";

// Settings of the rental: opening hours and the contact for customers.
// Not /settings: that one is every user's own (language).
export default function AdminSettingsPage() {
  const t = useT();
  const { data, error, mutate } = useApi<AdminSettingsResponse>(
    "/api/admin/settings",
  );

  let content = <Skeleton className="h-72 rounded-xl" />;
  if (data) {
    content = <SettingsForm settings={data.settings} />;
  } else if (error) {
    content = <ErrorState onRetry={() => mutate()} />;
  }

  return (
    <>
      <PageTitle>{t("adminSettings.title")}</PageTitle>
      {content}
    </>
  );
}
