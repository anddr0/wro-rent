import { Constants } from "@/lib/database.types";
import type { AdminReviewsResponse, ReviewStatus } from "@/lib/reviews";
import { requireAdmin } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid } from "@/server/request";
import { listAdminReviews } from "@/server/reviews";
import { createSupabaseClient } from "@/server/supabase";

// Reviews for moderation, the newest first.
// ?status=pending — only the ones waiting for an admin;
// ?bikeId=<id> — only the reviews of one bike.
export const GET = withErrorHandling(async (req) => {
  await requireAdmin(req);
  const params = new URL(req.url).searchParams;

  const bikeId = params.get("bikeId");
  if (bikeId !== null && !isUuid(bikeId)) {
    throw new HttpError(400, "bikeId must be an id");
  }

  const reviews = await listAdminReviews(createSupabaseClient(), {
    status: readStatus(params.get("status")),
    bikeId,
  });

  const response: AdminReviewsResponse = { reviews };
  return Response.json(response);
});

function readStatus(value: string | null): ReviewStatus | null {
  if (value === null) {
    return null;
  }
  for (const status of Constants.public.Enums.review_status) {
    if (status === value) {
      return status;
    }
  }
  throw new HttpError(400, "Unknown status");
}
