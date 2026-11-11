"use client";

import { createContext, use, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { StatusScreen } from "@/components/status-screen";
import { apiFetch } from "@/lib/api";
import type { Tables } from "@/lib/database.types";
import { useTelegram } from "@/lib/telegram/use-telegram";

type User = Tables<"users">;

type LoadState =
  { status: "loading" } | { status: "ready"; user: User } | { status: "error" };

const CurrentUserContext = createContext<User | null>(null);

// Loads the user once, when the mini app opens, and shows the pages only
// after that. So every page can rely on the user being there.
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { webApp } = useTelegram();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  // Telegram's script loads in a normal browser too, but initData is empty there.
  const isOutsideTelegram = webApp !== null && !webApp.initData;

  useEffect(() => {
    if (!webApp || !webApp.initData) {
      return;
    }

    async function loadUser() {
      try {
        const { user } = await apiFetch<{ user: User }>("/api/me");
        setState({ status: "ready", user });
      } catch (error) {
        console.error(error);
        setState({ status: "error" });
      }
    }

    loadUser();
  }, [webApp]);

  if (isOutsideTelegram) {
    return <StatusScreen>Откройте приложение через Telegram-бота</StatusScreen>;
  }
  if (state.status === "loading") {
    return <StatusScreen>Загрузка…</StatusScreen>;
  }
  if (state.status === "error") {
    return <StatusScreen>Не удалось загрузить профиль</StatusScreen>;
  }

  return <CurrentUserContext value={state.user}>{children}</CurrentUserContext>;
}

// The signed-in user. Works in any page: they are all inside the provider.
export function useCurrentUser(): User {
  const user = use(CurrentUserContext);
  if (user === null) {
    throw new Error("useCurrentUser must be used inside CurrentUserProvider");
  }
  return user;
}
