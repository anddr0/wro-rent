// A grey pulsing block in place of content that is still loading.
// It keeps the layout of the screen, so nothing jumps when data arrives.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}
