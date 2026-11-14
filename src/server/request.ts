import "server-only";
import { HttpError } from "@/server/http";

// The request body as an object. Anything else (not JSON, null, a number)
// is the client's mistake, not our bug, so it's a 400 and not a 500.
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Body must be JSON");
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "Body must be a JSON object");
  }
  return body as Record<string, unknown>;
}

// Ids in our tables are UUIDs: 8-4-4-4-12 hex digits. Anything else can't be
// an id, and Postgres would fail on it with an error instead of "not found".
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

// An optional text field: trimmed, null when empty or missing.
// Throws 400 when it isn't text or is longer than `maxLength`.
export function readOptionalText(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be text`);
  }

  const text = value.trim();
  if (text.length > maxLength) {
    throw new HttpError(400, `${fieldName} is too long`);
  }
  if (text === "") {
    return null;
  }
  return text;
}

// A required text field: like readOptionalText, but empty is a 400 too.
export function readRequiredText(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  const text = readOptionalText(value, fieldName, maxLength);
  if (text === null) {
    throw new HttpError(400, `${fieldName} is required`);
  }
  return text;
}

// The largest amount of money we accept, in zł: numeric(10, 2) holds more,
// but a bigger number is surely a typo.
const MAX_AMOUNT = 100000;

// A price or a deposit: a number from 0, with grosze at most.
export function readAmount(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpError(400, `${fieldName} must be a number`);
  }
  if (value < 0 || value > MAX_AMOUNT) {
    throw new HttpError(400, `${fieldName} is out of range`);
  }
  return Math.round(value * 100) / 100;
}
