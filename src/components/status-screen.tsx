import type { ReactNode } from "react";

// A full-screen message shown instead of the app: loading, errors and so on.
export function StatusScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-muted-foreground">
      {children}
    </div>
  );
}
