"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { TelegramWebApp } from "./types";

// window.Telegram.WebApp is set once by Telegram's script and never changes,
// so there is nothing to subscribe to.
function subscribe() {
  return function unsubscribe() {};
}

function getWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

// On the server there is no window and no Telegram.
function getWebAppOnServer(): null {
  return null;
}

export function useTelegram() {
  // Reads window safely during server rendering and hydration.
  const webApp = useSyncExternalStore(subscribe, getWebApp, getWebAppOnServer);

  useEffect(() => {
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
  }, [webApp]);

  const user = webApp ? (webApp.initDataUnsafe.user ?? null) : null;
  return { webApp, user };
}
