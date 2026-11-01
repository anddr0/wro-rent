// Server-side environment variables.
// They are read on first use, not at import time, so `next build` works without secrets.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env variable: ${name}`);
  }
  return value;
}

// Telegram accepts only HTTPS links for Web App buttons and webhooks.
function httpsUrl(name: string): string {
  let value = required(name);
  if (!value.startsWith("https://")) {
    throw new Error(`${name} must start with https:// (got "${value}")`);
  }
  if (value.endsWith("/")) {
    value = value.slice(0, -1);
  }
  return value;
}

export const env = {
  supabaseUrl: () => required("SUPABASE_URL"),
  supabaseSecretKey: () => required("SUPABASE_SECRET_KEY"),
  botToken: () => required("BOT_TOKEN"),
  appUrl: () => httpsUrl("APP_URL"),
  webhookSecret: () => required("TELEGRAM_WEBHOOK_SECRET"),
};

export const WEBHOOK_PATH = "/api/telegram/webhook";
