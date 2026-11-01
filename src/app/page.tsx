"use client";

import { useTelegram } from "@/lib/telegram/use-telegram";
import type { TelegramUser, TelegramWebApp } from "@/lib/telegram/types";

function getGreeting(webApp: TelegramWebApp | null, user: TelegramUser | null): string {
  if (user) {
    return `Привет, ${user.first_name}!`;
  }
  if (webApp) {
    return "Telegram подключён, но пользователь не передан";
  }
  return "Откройте приложение через Telegram-бота";
}

export default function Home() {
  const { webApp, user } = useTelegram();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Vityas Bike Rent 🚲</h1>
      <p className="text-zinc-500">{getGreeting(webApp, user)}</p>
    </main>
  );
}
