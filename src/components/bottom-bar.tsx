import type { ReactNode } from "react";

// The main action of a screen, pinned to the bottom so it is always in reach.
// Put it last on the page.
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col gap-2 border-t bg-background/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur [&>*]:w-full">
      {children}
    </div>
  );
}
