"use client";

import { RotateCw, WifiOff } from "lucide-react";
import { Button } from "@/components/button";
import { useT } from "@/lib/i18n/use-t";

// What a screen shows when its data didn't load, with a way to try again.
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useT();

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <WifiOff className="size-6 text-muted-foreground" />
      </span>
      <span className="font-semibold">{t("common.loadFailed")}</span>
      <Button variant="secondary" size="small" onClick={onRetry}>
        <RotateCw />
        {t("common.retry")}
      </Button>
    </div>
  );
}
