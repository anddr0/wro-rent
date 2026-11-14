import type { TelegramWebApp } from "./types";

// Asks "are you sure?" with Telegram's own dialog. Resolves to the answer.
export function confirmInTelegram(
  webApp: TelegramWebApp | null,
  message: string,
): Promise<boolean> {
  // Very old Telegram apps have no dialog: the browser's one does the same.
  if (!webApp || !webApp.isVersionAtLeast("6.2")) {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    webApp.showConfirm(message, resolve);
  });
}

// Makes sure the bot may write to the user: asks with Telegram's own dialog
// if it can't yet. Resolves to false when the user said no.
export function requestWriteAccess(
  webApp: TelegramWebApp | null,
): Promise<boolean> {
  if (!webApp) {
    return Promise.resolve(false);
  }
  if (webApp.initDataUnsafe.user?.allows_write_to_pm) {
    return Promise.resolve(true);
  }
  // An old Telegram app can't ask. Let the request go: the server checks
  // the access anyway and answers "write_access_required" if there is none.
  if (!webApp.isVersionAtLeast("6.9")) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    webApp.requestWriteAccess(resolve);
  });
}

// Opens a chat with this Telegram user.
export function openTelegramChat(
  webApp: TelegramWebApp | null,
  username: string,
): void {
  const url = `https://t.me/${username}`;
  if (webApp) {
    webApp.openTelegramLink(url);
  } else {
    window.open(url, "_blank");
  }
}
