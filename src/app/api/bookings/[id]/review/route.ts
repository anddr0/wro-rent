import { REVIEW_RULES } from "@/lib/reviews";
import type { OwnReviewResponse } from "@/lib/reviews";
import { requireUser } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid, readJson, readOptionalText } from "@/server/request";
import { createReview } from "@/server/reviews";
import { createSupabaseClient } from "@/server/supabase";

// The customer reviews the bike of their completed rental:
// { rating: 1–5, comment }. One review per booking.
export const POST = withErrorHandling(
  async (req, ctx: RouteContext<"/api/bookings/[id]/review">) => {
    const user = await requireUser(req);
    const { id } = await ctx.params;

    if (!isUuid(id)) {
      throw new HttpError(404, "Booking not found");
    }

    const body = await readJson(req);
    const rating = body.rating;
    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      throw new HttpError(400, "rating must be a whole number from 1 to 5");
    }
    const comment = readOptionalText(
      body.comment,
      "comment",
      REVIEW_RULES.maxCommentLength,
    );

    const review = await createReview(
      createSupabaseClient(),
      user,
      id,
      rating,
      comment,
    );

    const response: OwnReviewResponse = { review };
    return Response.json(response, { status: 201 });
  },
);
