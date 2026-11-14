export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  // True once the user let the bot write to them.
  allows_write_to_pm?: boolean;
};

// Minimal subset of window.Telegram.WebApp; extend as needed.
export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: { user?: TelegramUser; start_param?: string };
  colorScheme: "light" | "dark";
  ready: () => void;
  expand: () => void;
  close: () => void;
  // Colors of Telegram's own header and of the area around the page, "#RRGGBB".
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  // "themeChanged" fires when the user switches Telegram's light or dark theme.
  onEvent: (event: "themeChanged", callback: () => void) => void;
  offEvent: (event: "themeChanged", callback: () => void) => void;
  // Is the user's Telegram app new enough: isVersionAtLeast("6.9").
  isVersionAtLeast: (version: string) => boolean;
  // Telegram's own "OK / Cancel" dialog (Bot API 6.2+).
  showConfirm: (
    message: string,
    callback: (isConfirmed: boolean) => void,
  ) => void;
  // Asks the user to let the bot write to them (Bot API 6.9+).
  requestWriteAccess: (callback: (isAllowed: boolean) => void) => void;
  // Opens a t.me link (a chat, a profile) inside Telegram.
  openTelegramLink: (url: string) => void;
  // The "back" arrow in Telegram's header, hidden by default.
  BackButton: HeaderButton;
  // The "Settings" item in the mini app's ⋯ menu, hidden by default.
  SettingsButton: HeaderButton;
};

type HeaderButton = {
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}
