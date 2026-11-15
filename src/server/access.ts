import "server-only";

// The allow list: who may use the mini app and the bot. It protects the dev
// bot from strangers who find it. Set in ALLOWED_TELEGRAM_IDS as Telegram
// user ids separated by commas: "840550973, 123456789".
// Not set or empty (production): everyone is allowed.

// Reads the list from the variable's text. Null means "no list, allow everyone".
// Throws on anything that isn't a number: a typo must not silently lock
// everyone out or let everyone in.
export function parseAllowedIds(text: string | undefined): Set<number> | null {
  if (text === undefined || text.trim() === "") {
    return null;
  }

  const ids = new Set<number>();
  for (const part of text.split(",")) {
    const id = Number(part.trim());
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(
        `ALLOWED_TELEGRAM_IDS must be numbers separated by commas (got "${part.trim()}")`,
      );
    }
    ids.add(id);
  }
  return ids;
}

export function isTelegramUserAllowed(telegramId: number): boolean {
  const allowedIds = parseAllowedIds(process.env.ALLOWED_TELEGRAM_IDS);
  if (allowedIds === null) {
    return true;
  }
  return allowedIds.has(telegramId);
}
