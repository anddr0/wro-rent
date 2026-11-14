"use client";

import { useSyncExternalStore } from "react";
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

// Telegram's WebApp object and the user it was opened by.
// Null outside Telegram and while rendering on the server.
export function useTelegram() {
  // Reads window safely during server rendering and hydration.
  const webApp = useSyncExternalStore(subscribe, getWebApp, getWebAppOnServer);

  const user = webApp ? (webApp.initDataUnsafe.user ?? null) : null;
  return { webApp, user };
}
