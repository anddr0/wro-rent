// Reviews of bikes: what the API sends to the mini app, and the rules.
import type { Enums } from "@/lib/database.types";

export type ReviewStatus = Enums<"review_status">;

export const REVIEW_RULES = {
  maxCommentLength: 1000,
  // The first name is cut at this many characters in public reviews.
  maxNameLength: 16,
};

// A review on the bike's page, as other customers see it.
export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  // Shortened for privacy: "Andrii D.", see formatReviewerName.
  authorName: string;
  authorPhotoUrl: string | null;
};

// The reviews of one bike that customers see, with the average rating.
export type BikeReviews = {
  reviews: PublicReview[];
  // Null when the bike has no approved reviews yet.
  averageRating: number | null;
};

// The customer's own review, in the card of their booking.
export type OwnReview = {
  rating: number;
  comment: string | null;
  status: ReviewStatus;
};

// The body of POST /api/bookings/[id]/review.
export type NewReviewRequest = {
  rating: number;
  comment: string;
};

// POST /api/bookings/[id]/review
export type OwnReviewResponse = { review: OwnReview };

// A review as an admin sees it.
export type AdminReview = {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
  // The full name, as in Telegram.
  authorName: string;
  bike: { id: string; name: string };
};

// GET /api/admin/reviews?status=pending, GET /api/admin/reviews?bikeId=...
export type AdminReviewsResponse = { reviews: AdminReview[] };

// PATCH /api/admin/reviews/[id]: { status: "approved" } or { status: "hidden" }
export type AdminReviewResponse = { review: AdminReview };

// The name shown next to a public review: the first word in full, of every
// other word only the first letter. "Andrii Drobitko" → "Andrii D.",
// "Anna Maria Kowalska" → "Anna M. K.". A very long first word is cut.
export function formatReviewerName(fullName: string): string {
  // Split by any run of spaces; filter drops the empty pieces around them.
  const words = fullName.split(/\s+/).filter((word) => word !== "");
  if (words.length === 0) {
    return "";
  }

  // Array.from splits by characters, so an emoji is not cut in half.
  let firstName = words[0];
  const firstNameLetters = Array.from(firstName);
  if (firstNameLetters.length > REVIEW_RULES.maxNameLength) {
    const shortened = firstNameLetters.slice(0, REVIEW_RULES.maxNameLength - 1);
    firstName = `${shortened.join("")}…`;
  }

  const parts = [firstName];
  for (const word of words.slice(1)) {
    const firstLetter = Array.from(word)[0];
    parts.push(`${firstLetter.toUpperCase()}.`);
  }
  return parts.join(" ");
}

// "★★★★☆" for plain-text places like the bot's messages.
export function ratingAsStars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

// The average of the ratings rounded to one digit: 4.8. Null for no ratings.
export function averageRating(ratings: number[]): number | null {
  if (ratings.length === 0) {
    return null;
  }
  let sum = 0;
  for (const rating of ratings) {
    sum += rating;
  }
  return Math.round((sum / ratings.length) * 10) / 10;
}
