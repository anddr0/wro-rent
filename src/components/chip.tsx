import type { LucideIcon } from "lucide-react";

type ChipProps = {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  icon?: LucideIcon;
  // Shown crossed out and can't be picked, e.g. a busy time.
  isDisabled?: boolean;
};

// A small pill button for filters and quick choices (status, time).
export function Chip({
  label,
  isSelected,
  onSelect,
  icon: Icon,
  isDisabled = false,
}: ChipProps) {
  let colors = "bg-card text-foreground";
  if (isDisabled) {
    colors = "bg-muted text-muted-foreground line-through opacity-60";
  } else if (isSelected) {
    colors = "border-primary bg-primary text-primary-foreground";
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors ${colors}`}
    >
      {Icon && <Icon className="size-4" />}
      {label}
    </button>
  );
}
