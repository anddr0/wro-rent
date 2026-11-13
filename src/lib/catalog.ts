// What the catalog API sends to the mini app: only the fields customers see.
import type { Tables } from "@/lib/database.types";

export type CatalogBike = Pick<Tables<"bikes">, "id" | "name" | "description">;

export type CatalogPlan = Pick<Tables<"rental_plans">, "id" | "name" | "price">;

// GET /api/bikes
export type BikesResponse = {
  bikes: CatalogBike[];
  // The cheapest active plan, "from 50 zł". Null when no plan is active.
  priceFrom: number | null;
};

// GET /api/bikes/[id]
export type BikeResponse = {
  bike: CatalogBike;
  plans: CatalogPlan[];
};
