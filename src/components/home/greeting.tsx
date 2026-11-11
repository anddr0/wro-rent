"use client";

import { Avatar } from "@/components/avatar";
import { useCurrentUser } from "@/components/current-user";

export function Greeting({ subtitle }: { subtitle: string }) {
  const user = useCurrentUser();

  return (
    <div className="flex items-center gap-3">
      <Avatar photoUrl={user.photo_url} name={user.full_name} size={48} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xl font-semibold tracking-tight">
          Привет, {user.full_name}!
        </span>
        <span className="truncate text-muted-foreground">{subtitle}</span>
      </div>
    </div>
  );
}
