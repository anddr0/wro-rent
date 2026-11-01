// Calls our API from the mini app. Sends Telegram initData in the
// Authorization header so the server can check who the user is.
// Throws an Error with the server's message if the response is not 2xx.
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const initData = window.Telegram?.WebApp.initData ?? "";

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `tma ${initData}`);

  const res = await fetch(path, { ...init, headers });

  if (!res.ok) {
    // Our routes always answer errors as { error: "..." } (see withErrorHandling).
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return (await res.json()) as T;
}
