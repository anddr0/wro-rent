// Reads an amount of money typed by a person: "70", "70.5", "70,50".
// Null when it isn't a number from 0, or has more than two digits of grosze.
export function parseAmount(text: string): number | null {
  const normalized = text.trim().replace(",", ".");
  // Digits, then optionally a dot and one or two more digits.
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  return Number(normalized);
}
