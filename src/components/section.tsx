import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type SectionProps = {
  title?: string;
  children: ReactNode;
};

// A card with related rows, like a group in Telegram's settings.
export function Section({ title, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-2">
      {title && <SectionTitle>{title}</SectionTitle>}
      <div className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
        {children}
      </div>
    </section>
  );
}

// A small label above a block. Also used above blocks that aren't a Section.
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h2>
  );
}

type RowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  // Shown on the right of the title, on its line: a status, a "Hidden" mark.
  badge?: ReactNode;
  // Shown on the right of the whole row: a price, a button.
  end?: ReactNode;
  // Shown on the left: an avatar, a photo. For an icon use `icon`.
  start?: ReactNode;
  icon?: LucideIcon;
  // When set, the whole row opens this page.
  href?: string;
  // When set, the whole row is a button, e.g. it opens a Telegram chat.
  onClick?: () => void;
};

export function Row({
  title,
  subtitle,
  badge,
  end,
  start,
  icon,
  href,
  onClick,
}: RowProps) {
  const content = (
    <>
      {icon && <RowIcon icon={icon} />}
      {start}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          {/* A long title takes two lines, then is cut with "…". */}
          <span className="line-clamp-2 font-medium wrap-anywhere">
            {title}
          </span>
          {badge}
        </div>
        {subtitle && (
          <span className="text-sm text-muted-foreground wrap-anywhere">
            {subtitle}
          </span>
        )}
      </div>
      {end}
      {(href || onClick) && (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      )}
    </>
  );
  const classes = "flex min-h-14 items-center gap-3 px-4 py-3";

  if (href) {
    return (
      <Link
        href={href}
        className={`${classes} transition-colors active:bg-muted`}
      >
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${classes} text-left transition-colors active:bg-muted`}
      >
        {content}
      </button>
    );
  }
  return <div className={classes}>{content}</div>;
}

function RowIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
      <Icon className="size-[18px]" />
    </span>
  );
}

type DetailRowProps = {
  label: string;
  value: ReactNode;
};

// A "label — value" line, for booking details and the like.
export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      {/* wrap-anywhere: a long word without spaces breaks instead of
          pushing the row wider than the screen. */}
      <span className="min-w-0 text-right font-medium wrap-anywhere">
        {value}
      </span>
    </div>
  );
}
