// An error answer from our API. `status` tells "not found" (404) apart
// from "something broke" (500), so screens can show the right message.
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Calls our API from the mini app. Sends Telegram initData in the
// Authorization header so the server can check who the user is.
// Throws ApiError with the server's message if the response is not 2xx.
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
    throw new ApiError(
      res.status,
      body.error ?? `Request failed with status ${res.status}`,
    );
  }

  return (await res.json()) as T;
}
