import "server-only";
import { after } from "next/server";
import { averageRating, formatReviewerName } from "@/lib/reviews";
import type {
  AdminReview,
  BikeReviews,
  OwnReview,
  ReviewStatus,
} from "@/lib/reviews";
import { HttpError } from "@/server/http";
import { notifyAdminsAboutNewReview } from "@/server/notifications";
import type { Supabase } from "@/server/supabase";

// Postgres error "this value is already taken": here, a second review
// for the same booking.
const UNIQUE_VIOLATION = "23505";

// Leaves a review after a completed rental. Only the customer of the booking
// can, and only once. The review waits for an admin before anyone sees it.
export async function createReview(
  supabase: Supabase,
  customer: { id: string; full_name: string },
  bookingId: string,
  rating: number,
  comment: string | null,
): Promise<OwnReview> {
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, status, bike_id, bikes(name)")
    .eq("id", bookingId)
    .eq("user_id", customer.id)
    .maybeSingle();

  if (bookingError) {
    throw bookingError;
  }
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }
  if (booking.status !== "completed") {
    throw new HttpError(
      409,
      "A review can be left only after a completed rental",
      "review_not_allowed",
    );
  }

  const { data: review, error } = await supabase
    .from("bike_reviews")
    .insert({
      booking_id: booking.id,
      bike_id: booking.bike_id,
      user_id: customer.id,
      rating,
      comment,
    })
    .select("rating, comment, status")
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new HttpError(
        409,
        "This rental already has a review",
        "already_reviewed",
      );
    }
    throw error;
  }

  // Admins get the message after the customer already has the answer.
  after(() =>
    notifyAdminsAboutNewReview(supabase, {
      customerName: customer.full_name,
      bikeName: booking.bikes.name,
      rating,
      comment,
    }),
  );

  return review;
}

// The customer's own review of a booking, or null if they left none.
export async function findOwnReview(
  supabase: Supabase,
  bookingId: string,
): Promise<OwnReview | null> {
  const { data, error } = await supabase
    .from("bike_reviews")
    .select("rating, comment, status")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

// The approved reviews of a bike for its page, the newest first.
// Authors' names are shortened here, on the server: full names of other
// customers never reach the mini app.
export async function listPublicReviews(
  supabase: Supabase,
  bikeId: string,
): Promise<BikeReviews> {
  const { data, error } = await supabase
    .from("bike_reviews")
    .select("id, rating, comment, users(full_name, photo_url)")
    .eq("bike_id", bikeId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return {
    reviews: data.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      authorName: formatReviewerName(review.users.full_name),
      authorPhotoUrl: review.users.photo_url,
    })),
    averageRating: averageRating(data.map((review) => review.rating)),
  };
}

const ADMIN_REVIEW_FIELDS =
  "id, rating, comment, status, created_at, users(full_name), bikes(id, name)";

type AdminReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  created_at: string;
  users: { full_name: string };
  bikes: { id: string; name: string };
};

function toAdminReview(row: AdminReviewRow): AdminReview {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
    authorName: row.users.full_name,
    bike: row.bikes,
  };
}

export type AdminReviewsFilter = {
  // Only reviews in this status; null — in any.
  status: ReviewStatus | null;
  // Only reviews of this bike; null — of all bikes.
  bikeId: string | null;
};

// Reviews for moderation, the newest first.
export async function listAdminReviews(
  supabase: Supabase,
  filter: AdminReviewsFilter,
): Promise<AdminReview[]> {
  let query = supabase
    .from("bike_reviews")
    .select(ADMIN_REVIEW_FIELDS)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter.status !== null) {
    query = query.eq("status", filter.status);
  }
  if (filter.bikeId !== null) {
    query = query.eq("bike_id", filter.bikeId);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data.map(toAdminReview);
}

// Approves a review or hides it. An admin can change their mind any time.
export async function setReviewStatus(
  supabase: Supabase,
  reviewId: string,
  status: ReviewStatus,
): Promise<AdminReview> {
  const { data, error } = await supabase
    .from("bike_reviews")
    .update({ status })
    .eq("id", reviewId)
    .select(ADMIN_REVIEW_FIELDS)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new HttpError(404, "Review not found");
  }
  return toAdminReview(data);
}

export async function countPendingReviews(supabase: Supabase): Promise<number> {
  // `head: true` asks only for the number of rows, not the rows.
  const { count, error } = await supabase
    .from("bike_reviews")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    throw error;
  }
  return count ?? 0;
}
