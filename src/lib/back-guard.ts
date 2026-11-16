// A screen with unsaved changes can ask before Telegram's "back" arrow takes
// the user away. The screen sets a guard while it has changes and removes it
// when it hasn't (or when it leaves by itself, e.g. after saving).
type BackGuard = () => Promise<boolean>;

let guard: BackGuard | null = null;

export function setBackGuard(nextGuard: BackGuard | null): void {
  guard = nextGuard;
}

// True when it's fine to go back: there is no guard, or the user agreed.
export async function canGoBack(): Promise<boolean> {
  if (guard === null) {
    return true;
  }
  return guard();
}
