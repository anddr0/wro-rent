"use client";

import { useEffect, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => window.Telegram?.WebApp ?? null;
const getServerSnapshot = () => null;

export function useTelegram() {
  const webApp = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    webApp?.ready();
    webApp?.expand();
  }, [webApp]);

  return { webApp, user: webApp?.initDataUnsafe.user ?? null };
}
