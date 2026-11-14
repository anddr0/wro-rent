"use client";

import { Avatar } from "@/components/avatar";
import { useCurrentUser } from "@/components/current-user";
import { useT } from "@/lib/i18n/use-t";

export function Greeting({ subtitle }: { subtitle: string }) {
  const user = useCurrentUser();
  const t = useT();

  return (
    <div className="flex items-center gap-3">
      <Avatar photoUrl={user.photo_url} name={user.full_name} size={48} />
      <div className="flex min-w-0 flex-col">
        {/* A long name takes two lines, then is cut with "…". */}
        <span className="line-clamp-2 text-xl leading-tight font-semibold tracking-tight wrap-anywhere">
          {t("home.greeting", { name: user.full_name })}
        </span>
        <span className="text-muted-foreground wrap-anywhere">{subtitle}</span>
      </div>
    </div>
  );
}
