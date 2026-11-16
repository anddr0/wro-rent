"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { canGoBack } from "@/lib/back-guard";
import { useTelegram } from "@/lib/telegram/use-telegram";

// Telegram's own buttons in the mini app header, shared by all pages:
// the back arrow (everywhere except the home page) and "Settings" in the ⋯ menu.
export function TelegramHeaderButtons() {
  const { webApp } = useTelegram();
  const pathname = usePathname();
  const router = useRouter();

  const isHomePage = pathname === "/";

  useEffect(() => {
    if (!webApp) {
      return;
    }
    if (isHomePage) {
      webApp.BackButton.hide();
      return;
    }

    async function goBack() {
      // A screen with unsaved changes may ask first (see back-guard.ts).
      if (!(await canGoBack())) {
        return;
      }
      // Opened straight on this page (a button under a bot message):
      // there is nothing to go back to, so go to the home page.
      if (window.history.length <= 1) {
        router.replace("/");
      } else {
        router.back();
      }
    }

    webApp.BackButton.show();
    webApp.BackButton.onClick(goBack);
    return () => webApp.BackButton.offClick(goBack);
  }, [webApp, isHomePage, router]);

  useEffect(() => {
    if (!webApp) {
      return;
    }

    function openSettings() {
      router.push("/settings");
    }

    webApp.SettingsButton.show();
    webApp.SettingsButton.onClick(openSettings);
    return () => webApp.SettingsButton.offClick(openSettings);
  }, [webApp, router]);

  return null;
}
