"use client";

import Image from "next/image";
import { useState } from "react";

type AvatarProps = {
  photoUrl: string | null;
  name: string;
  size?: number;
};

// The user's Telegram photo, or the first letter of their name when there is
// no photo (hidden in Telegram privacy settings) or it failed to load.
export function Avatar({ photoUrl, name, size = 80 }: AvatarProps) {
  const [hasFailed, setHasFailed] = useState(false);

  if (!photoUrl || hasFailed) {
    // Array.from splits by characters, so a name starting with an emoji works too.
    const firstLetter = Array.from(name)[0] ?? "?";

    return (
      <div
        className="flex items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground"
        style={{ width: size, height: size, fontSize: size / 2.5 }}
      >
        {firstLetter.toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={photoUrl}
      alt={name}
      width={size}
      height={size}
      // Telegram's avatars are small already, and Vercel's image optimization
      // has a monthly limit: with reviews there are many different avatars.
      unoptimized
      className="rounded-full"
      onError={() => setHasFailed(true)}
    />
  );
}
