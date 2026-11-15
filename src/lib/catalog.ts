// What the catalog API sends to the mini app: only the fields customers see.
import type { Tables } from "@/lib/database.types";
import type { BikeReviews } from "@/lib/reviews";

type BikeFields = Pick<Tables<"bikes">, "id" | "name" | "description">;

// A bike in the catalog list, with its cover (the first photo).
export type CatalogBike = BikeFields & { coverUrl: string | null };

// A bike on its own page, with all its photos in order.
export type BikeDetails = BikeFields & { photoUrls: string[] };

export type CatalogPlan = Pick<
  Tables<"rental_plans">,
  "id" | "name" | "price" | "duration_count" | "duration_unit"
>;

// GET /api/bikes
export type BikesResponse = {
  bikes: CatalogBike[];
  // The cheapest active plan, "from 50 zł". Null when no plan is active.
  priceFrom: number | null;
};

// GET /api/bikes/[id]
export type BikeResponse = {
  bike: BikeDetails;
  plans: CatalogPlan[];
  // Approved reviews and the average rating.
  reviews: BikeReviews;
};
