"use client";

import { createContext, use, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LoadingScreen, StatusScreen } from "@/components/status-screen";
import { apiFetch } from "@/lib/api";
import type { Tables } from "@/lib/database.types";
import { resolveLocale } from "@/lib/i18n/locales";
import { createTranslate } from "@/lib/i18n/translate";
import { LocaleContext } from "@/lib/i18n/use-t";
import { useTelegram } from "@/lib/telegram/use-telegram";

type User = Tables<"users">;

type LoadState =
  { status: "loading" } | { status: "ready"; user: User } | { status: "error" };

type CurrentUserContextValue = {
  user: User;
  // Replaces the user after the server changed it, e.g. a new language.
  setUser: (user: User) => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

// Loads the user once, when the mini app opens, and shows the pages only
// after that. So every page can rely on the user being there.
// Also sets the app language: the user's choice, otherwise Telegram's.
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { webApp, user: telegramUser } = useTelegram();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  // Telegram's script loads in a normal browser too, but initData is empty there.
  const isOutsideTelegram = webApp !== null && !webApp.initData;

  // Until the user is loaded, only Telegram's language is known.
  let locale = resolveLocale(null, telegramUser?.language_code);
  if (state.status === "ready") {
    locale = resolveLocale(state.user.locale, state.user.language_code);
  }

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Once, when the mini app opens: tell Telegram the page is ready to be
  // shown and ask for the full height of the screen.
  useEffect(() => {
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
  }, [webApp]);

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

  const t = createTranslate(locale);

  if (isOutsideTelegram) {
    return <StatusScreen>{t("common.openViaBot")}</StatusScreen>;
  }
  if (state.status === "loading") {
    return <LoadingScreen />;
  }
  if (state.status === "error") {
    return <StatusScreen>{t("common.profileLoadFailed")}</StatusScreen>;
  }

  function setUser(user: User) {
    setState({ status: "ready", user });
  }

  return (
    <CurrentUserContext value={{ user: state.user, setUser }}>
      <LocaleContext value={locale}>{children}</LocaleContext>
    </CurrentUserContext>
  );
}

// The signed-in user. Works in any page: they are all inside the provider.
export function useCurrentUser(): User {
  return useCurrentUserContext().user;
}

// For pages that change the user, e.g. the language in settings.
export function useSetCurrentUser(): (user: User) => void {
  return useCurrentUserContext().setUser;
}

function useCurrentUserContext(): CurrentUserContextValue {
  const value = use(CurrentUserContext);
  if (value === null) {
    throw new Error("useCurrentUser must be used inside CurrentUserProvider");
  }
  return value;
}
