import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { averageRating, formatReviewerName, ratingAsStars } from "./reviews";

describe("formatReviewerName", () => {
  it("keeps the first word and shortens the rest to initials", () => {
    assert.equal(formatReviewerName("Andrii Drobitko"), "Andrii D.");
    assert.equal(formatReviewerName("Anna Maria Kowalska"), "Anna M. K.");
  });

  it("leaves a single name as it is", () => {
    assert.equal(formatReviewerName("Marta"), "Marta");
  });

  it("ignores extra spaces", () => {
    assert.equal(formatReviewerName("  Олег   петров "), "Олег П.");
  });

  it("cuts a very long first word", () => {
    assert.equal(
      formatReviewerName("Bartholomeusz-Maksymilian Nowak"),
      "Bartholomeusz-M… N.",
    );
  });

  it("doesn't break an emoji", () => {
    assert.equal(formatReviewerName("Kate 🚲bike"), "Kate 🚲.");
  });

  it("returns an empty text for an empty name", () => {
    assert.equal(formatReviewerName("   "), "");
  });
});

describe("ratingAsStars", () => {
  it("fills as many stars as the rating", () => {
    assert.equal(ratingAsStars(4), "★★★★☆");
    assert.equal(ratingAsStars(5), "★★★★★");
  });
});

describe("averageRating", () => {
  it("rounds to one digit", () => {
    assert.equal(averageRating([5, 4, 4]), 4.3);
    assert.equal(averageRating([5, 5]), 5);
  });

  it("returns null when there are no ratings", () => {
    assert.equal(averageRating([]), null);
  });
});
