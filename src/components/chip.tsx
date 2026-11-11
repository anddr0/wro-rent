import type { LucideIcon } from "lucide-react";

type ChipProps = {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  icon?: LucideIcon;
};

// A small pill button for filters and quick choices (status, time).
export function Chip({ label, isSelected, onSelect, icon: Icon }: ChipProps) {
  let colors = "bg-card text-foreground";
  if (isSelected) {
    colors = "border-primary bg-primary text-primary-foreground";
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors ${colors}`}
    >
      {Icon && <Icon className="size-4" />}
      {label}
    </button>
  );
}
