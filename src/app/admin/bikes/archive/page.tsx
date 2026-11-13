"use client";

import { Archive } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/page-title";
import { useT } from "@/lib/i18n/use-t";

// TODO(slice 5.4): archived bikes, with a button to bring each one back.
export default function ArchivedBikesPage() {
  const t = useT();

  return (
    <>
      <PageTitle>{t("adminArchive.title")}</PageTitle>
      <EmptyState
        icon={Archive}
        title={t("adminArchive.empty")}
        description={t("adminArchive.emptyHint")}
      />
    </>
  );
}
