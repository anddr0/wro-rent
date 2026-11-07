// Usage: npm run webhook:set | webhook:info | webhook:delete  (dev bot, reads .env.local)
//        npm run webhook:set:prod | webhook:info:prod        (prod bot, reads .env.prod)
// Shell env vars take precedence over the env file.
import { Api } from "grammy";
import { env, WEBHOOK_PATH } from "../src/server/env";

const api = new Api(env.botToken());
const command = process.argv[2] ?? "info";

if (command === "set") {
  const url = env.appUrl() + WEBHOOK_PATH;
  await api.setWebhook(url, {
    secret_token: env.webhookSecret(),
    drop_pending_updates: true,
  });
  console.log(`Webhook set: ${url}`);

  // Without chat_id the button becomes the default for every user,
  // so the mini app opens from the chat without typing /start.
  await api.setChatMenuButton({
    menu_button: {
      type: "web_app",
      text: "Открыть",
      web_app: { url: env.appUrl() },
    },
  });
  console.log("Menu button set");
} else if (command === "delete") {
  await api.deleteWebhook({ drop_pending_updates: true });
  console.log("Webhook deleted");
}

const me = await api.getMe();
const info = await api.getWebhookInfo();
const menuButton = await api.getChatMenuButton();
console.log(`@${me.username}`, {
  url: info.url || "(none)",
  pending_update_count: info.pending_update_count,
  last_error: info.last_error_message,
  menu_button: menuButton,
});
