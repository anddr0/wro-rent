// A grey mark in the admin's lists: "Hidden" on a bike or a plan
// customers don't see.
export function HiddenBadge({ label }: { label: string }) {
  return (
    <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  );
}
