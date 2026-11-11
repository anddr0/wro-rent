"use client";

import { useEffect } from "react";
import { useTelegram } from "@/lib/telegram/use-telegram";

// Same as --background in globals.css, in the "#RRGGBB" form Telegram accepts.
const BACKGROUND_COLORS = {
  light: "#ffffff",
  dark: "#171717",
};

// Our theme has a light and a dark palette; the user's Telegram theme picks one.
// Telegram's header gets the page color too, so there is no seam under it.
export function TelegramColorScheme() {
  const { webApp } = useTelegram();

  useEffect(() => {
    if (!webApp) {
      return;
    }

    function applyColorScheme() {
      if (!webApp) {
        return;
      }
      const scheme = webApp.colorScheme;
      document.documentElement.classList.toggle("dark", scheme === "dark");
      webApp.setHeaderColor(BACKGROUND_COLORS[scheme]);
      webApp.setBackgroundColor(BACKGROUND_COLORS[scheme]);
    }

    applyColorScheme();
    webApp.onEvent("themeChanged", applyColorScheme);
    return () => webApp.offEvent("themeChanged", applyColorScheme);
  }, [webApp]);

  return null;
}
