import type { ReactNode } from "react";

type PageTitleProps = {
  children: ReactNode;
  // A line of muted text under the title.
  description?: ReactNode;
  // Shown on the right of the title, e.g. a status.
  end?: ReactNode;
};

export function PageTitle({ children, description, end }: PageTitleProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{children}</h1>
        {end}
      </div>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
