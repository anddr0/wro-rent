"use client";

import type { CatalogBike } from "@/lib/catalog";
import { useT } from "@/lib/i18n/use-t";

type BikeNoteProps = {
  bike: CatalogBike;
  priceFrom: number | null;
};

// The line under a bike's name: "temporarily unavailable" or the price "from".
export function BikeNote({ bike, priceFrom }: BikeNoteProps) {
  const t = useT();

  if (bike.isPaused) {
    return (
      <span className="text-sm font-medium text-muted-foreground">
        {t("pause.customerNote")}
      </span>
    );
  }
  if (priceFrom === null) {
    return null;
  }
  return (
    <span className="text-sm text-muted-foreground">
      {t("common.priceFrom", { price: priceFrom })}
    </span>
  );
}
