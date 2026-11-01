export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

// Minimal subset of window.Telegram.WebApp; extend as needed.
export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: { user?: TelegramUser; start_param?: string };
  colorScheme: "light" | "dark";
  ready: () => void;
  expand: () => void;
  close: () => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}
