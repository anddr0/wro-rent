"use client";

import { useTelegram } from "@/lib/telegram/use-telegram";

export default function Home() {
  const { webApp, user } = useTelegram();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Vityas Bike Rent 🚲</h1>
      <p className="text-zinc-500">
        {user
          ? `Привет, ${user.first_name}!`
          : webApp
            ? "Telegram подключён, но пользователь не передан"
            : "Откройте приложение через Telegram-бота"}
      </p>
    </main>
  );
}
