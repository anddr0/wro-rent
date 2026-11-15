"use client";

import { Star } from "lucide-react";
import { useT } from "@/lib/i18n/use-t";

const STAR_NUMBERS = [1, 2, 3, 4, 5];

type StarsProps = {
  rating: number;
  size?: "small" | "large";
};

// A rating as five stars, `rating` of them filled. Only shows it.
export function Stars({ rating, size = "small" }: StarsProps) {
  const t = useT();

  return (
    <span
      role="img"
      aria-label={t("review.starLabel", { count: rating })}
      className="flex shrink-0 gap-0.5"
    >
      {STAR_NUMBERS.map((number) => (
        <StarIcon key={number} isFilled={number <= rating} size={size} />
      ))}
    </span>
  );
}

type StarPickerProps = {
  // 0 while nothing is picked yet.
  rating: number;
  onChange: (rating: number) => void;
};

// Five big stars to tap: the rating in the review form.
export function StarPicker({ rating, onChange }: StarPickerProps) {
  const t = useT();

  return (
    <div role="radiogroup" className="flex gap-2">
      {STAR_NUMBERS.map((number) => (
        <button
          key={number}
          type="button"
          role="radio"
          aria-checked={number === rating}
          aria-label={t("review.starLabel", { count: number })}
          onClick={() => onChange(number)}
          className="transition-transform active:scale-90"
        >
          <StarIcon isFilled={number <= rating} size="large" />
        </button>
      ))}
    </div>
  );
}

type StarIconProps = {
  isFilled: boolean;
  size: "small" | "large";
};

function StarIcon({ isFilled, size }: StarIconProps) {
  const sizeClass = size === "large" ? "size-9" : "size-4";
  // An empty star is only an outline, a filled one is painted in.
  const colorClass = isFilled
    ? "fill-foreground text-foreground"
    : "text-muted-foreground/40";

  return <Star className={`${sizeClass} ${colorClass}`} strokeWidth={1.5} />;
}
