// Reasons of an error the mini app has its own text for. The server sends one
// as `code` next to the English message (see HttpError).
export type ApiErrorCode =
  // A new request: the time is taken, not offered, or the plan is gone.
  | "dates_taken"
  | "start_not_allowed"
  | "plan_unavailable"
  | "too_many_bookings"
  | "already_requested"
  | "write_access_required"
  // Someone changed the booking in the meantime, e.g. it's already cancelled.
  | "status_changed"
  // Admin: the bike has bookings and can only be archived.
  | "bike_has_bookings"
  | "too_many_photos"
  | "bad_photo";

// An error answer from our API. `status` tells "not found" (404) apart
// from "something broke" (500), so screens can show the right message.
export class ApiError extends Error {
  status: number;
  code: ApiErrorCode | null;

  constructor(status: number, message: string, code: ApiErrorCode | null) {
    super(message);
    this.status = status;
    this.code = code;
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
    const body = await readErrorBody(res);
    throw new ApiError(
      res.status,
      body.error ?? `Request failed with status ${res.status}`,
      body.code ?? null,
    );
  }

  return (await res.json()) as T;
}

// Sends a change to our API with a JSON body:
// apiSendJson("POST", "/api/bookings", { bikeId, planId }).
export function apiSendJson<T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body: unknown = {},
): Promise<T> {
  return apiFetch<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

type ErrorBody = { error?: string; code?: ApiErrorCode | null };

// Our routes answer errors as { error, code } (see withErrorHandling). But an
// error can also come from the hosting, e.g. "request too large", as plain text.
async function readErrorBody(res: Response): Promise<ErrorBody> {
  try {
    return (await res.json()) as ErrorBody;
  } catch {
    return {};
  }
}

// The code of an error thrown by apiFetch, or null for any other error.
export function apiErrorCode(error: unknown): ApiErrorCode | null {
  if (error instanceof ApiError) {
    return error.code;
  }
  return null;
}
