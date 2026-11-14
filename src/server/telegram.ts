import "server-only";
import { Api, GrammyError, InlineKeyboard } from "grammy";
import { env } from "@/server/env";

// A button under a message that opens the mini app on this page, e.g. "/bookings/<id>".
export type MessageButton = {
  text: string;
  path: string;
};

function createApi(): Api {
  return new Api(env.botToken());
}

// Sends a message from the bot. Never throws: a message that didn't go
// through must not undo what was just saved (a booking, its new status).
export async function sendTelegramMessage(
  telegramId: number,
  text: string,
  button?: MessageButton,
): Promise<void> {
  try {
    let keyboard: InlineKeyboard | undefined;
    if (button) {
      keyboard = new InlineKeyboard().webApp(
        button.text,
        `${env.appUrl()}${button.path}`,
      );
    }
    await createApi().sendMessage(telegramId, text, { reply_markup: keyboard });
  } catch (error) {
    console.error(
      `Could not send a Telegram message to ${telegramId}:`,
      errorText(error),
    );
  }
}

// Can the bot write to this user? It can once the user started the bot or
// allowed messages in the mini app. Telegram has no method to ask, so we try
// the most harmless one: "typing…" shows for a few seconds and sends nothing.
export async function canBotWriteTo(telegramId: number): Promise<boolean> {
  try {
    await createApi().sendChatAction(telegramId, "typing");
    return true;
  } catch (error) {
    // 403: the user blocked the bot or never started it. 400: chat not found.
    if (error instanceof GrammyError) {
      if (error.error_code === 403 || error.error_code === 400) {
        return false;
      }
    }
    // Telegram itself is unreachable: that's not the customer's fault,
    // don't stop the booking because of it.
    console.error("Could not check write access:", errorText(error));
    return true;
  }
}

// Only the message: the whole error object of a failed request can hold
// the request's address, and the address has the bot token in it.
function errorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
