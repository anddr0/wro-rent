// Usage: npm run webhook:set | webhook:info | webhook:delete
// Reads .env.local; shell env vars take precedence (e.g. to target production).
import { Api } from "grammy";
import { env, WEBHOOK_PATH } from "../src/lib/env";

const api = new Api(env.botToken());
const command = process.argv[2] ?? "info";

if (command === "set") {
  const url = env.appUrl() + WEBHOOK_PATH;
  await api.setWebhook(url, {
    secret_token: env.webhookSecret(),
    drop_pending_updates: true,
  });
  console.log(`Webhook set: ${url}`);
} else if (command === "delete") {
  await api.deleteWebhook({ drop_pending_updates: true });
  console.log("Webhook deleted");
}

const me = await api.getMe();
const info = await api.getWebhookInfo();
console.log(`@${me.username}`, {
  url: info.url || "(none)",
  pending_update_count: info.pending_update_count,
  last_error: info.last_error_message,
});
