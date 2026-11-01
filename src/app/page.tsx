"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Enums, Tables } from "@/lib/database.types";
import { useTelegram } from "@/lib/telegram/use-telegram";

type User = Tables<"users">;

type MeState =
  { status: "loading" } | { status: "ready"; user: User } | { status: "error" };

const ROLE_LABELS: Record<Enums<"user_role">, string> = {
  admin: "Администратор",
  customer: "Клиент",
};

export default function Home() {
  const { webApp } = useTelegram();
  const [me, setMe] = useState<MeState>({ status: "loading" });

  // Telegram's script loads in a normal browser too, but initData is empty there.
  const isOutsideTelegram = webApp !== null && !webApp.initData;

  useEffect(() => {
    if (!webApp || !webApp.initData) {
      return;
    }

    async function loadMe() {
      try {
        const { user } = await apiFetch<{ user: User }>("/api/me");
        setMe({ status: "ready", user });
      } catch (error) {
        console.error(error);
        setMe({ status: "error" });
      }
    }

    loadMe();
  }, [webApp]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Vityas Bike Rent 🚲</h1>
      <Greeting me={me} isOutsideTelegram={isOutsideTelegram} />
    </main>
  );
}

type GreetingProps = {
  me: MeState;
  isOutsideTelegram: boolean;
};

function Greeting({ me, isOutsideTelegram }: GreetingProps) {
  if (isOutsideTelegram) {
    return (
      <p className="text-zinc-500">Откройте приложение через Telegram-бота</p>
    );
  }
  if (me.status === "loading") {
    return <p className="text-zinc-500">Загрузка…</p>;
  }
  if (me.status === "error") {
    return <p className="text-red-500">Не удалось загрузить профиль</p>;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-lg">Привет, {me.user.full_name}!</p>
      <span className="rounded-full border border-current px-3 py-1 text-sm text-zinc-500">
        {ROLE_LABELS[me.user.role]}
      </span>
    </div>
  );
}
