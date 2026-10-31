// Server-side env, read lazily so `next build` works without secrets.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env variable: ${name}`);
  return value;
}

// Telegram accepts only HTTPS links for Web App buttons and webhooks.
function httpsUrl(name: string): string {
  const value = required(name).replace(/\/+$/, "");
  if (!value.startsWith("https://")) {
    throw new Error(`${name} must start with https:// (got "${value}")`);
  }
  return value;
}

export const env = {
  botToken: () => required("BOT_TOKEN"),
  appUrl: () => httpsUrl("APP_URL"),
  webhookSecret: () => required("TELEGRAM_WEBHOOK_SECRET"),
};

export const WEBHOOK_PATH = "/api/telegram/webhook";
