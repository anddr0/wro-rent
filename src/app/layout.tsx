import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Manrope } from "next/font/google";
import { Suspense } from "react";
import { CurrentUserProvider } from "@/components/current-user";
import { StatusScreen } from "@/components/status-screen";
import { TelegramColorScheme } from "@/components/telegram-color-scheme";
import { TelegramHeaderButtons } from "@/components/telegram-header-buttons";
import "./globals.css";

// latin-ext for Polish letters, cyrillic for Russian and Ukrainian.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

export const metadata: Metadata = {
  title: "WroRent",
  description: "Прокат велосипедов во Вроцлаве",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Telegram's script adds theme CSS variables to <html> before React
    // hydrates, and TelegramColorScheme adds the "dark" class;
    // suppressHydrationWarning ignores that (only on this tag).
    <html
      lang="ru"
      className={`${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <TelegramColorScheme />
        <CurrentUserProvider>
          {/* Pages with an id in the URL (/bikes/[id]) learn it only when
              the page is opened, not at build time. Until then Next shows this
              fallback; without Suspense the build fails. */}
          <Suspense fallback={<StatusScreen>Загрузка…</StatusScreen>}>
            <TelegramHeaderButtons />
            <main className="flex flex-1 flex-col gap-6 px-4 pt-5 pb-4">
              {children}
            </main>
          </Suspense>
        </CurrentUserProvider>
      </body>
    </html>
  );
}
