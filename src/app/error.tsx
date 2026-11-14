"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/button";
import { useT } from "@/lib/i18n/use-t";

type ErrorPageProps = {
  error: unknown;
  // Renders the page again.
  retry: () => void;
};

// Shown instead of a page that crashed while rendering (a bug of ours),
// so the user sees a way out and not a blank screen.
export default function ErrorPage({ error, retry }: ErrorPageProps) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <TriangleAlert className="size-6 text-muted-foreground" />
      </span>
      <span className="font-semibold">{t("common.pageCrashed")}</span>
      <Button variant="secondary" size="small" onClick={retry}>
        <RotateCw />
        {t("common.retry")}
      </Button>
    </div>
  );
}
