import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

// A full-screen message shown instead of the app: loading, errors and so on.
export function StatusScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-muted-foreground">
      {children}
    </div>
  );
}

// A spinner instead of "Loading…": it needs no translation, so it works
// before we know the user's language.
export function LoadingScreen() {
  return (
    <StatusScreen>
      <LoaderCircle className="size-6 animate-spin" />
    </StatusScreen>
  );
}
