"use client";

import useSWR, { mutate } from "swr";
import { ApiError, apiFetch } from "@/lib/api";

// Loads data from our API for a screen: const { data, error } = useApi<T>("/api/bikes").
// SWR keeps the answer in memory by its path, so:
// - coming back to a screen shows the data at once and refreshes it quietly;
// - two components asking for the same path make one request;
// - when the user returns to the mini app, the data is refreshed.
// Pass null as the path to load nothing yet.
export function useApi<T>(path: string | null) {
  return useSWR<T, Error>(path, apiFetch<T>, {
    // A 404 or 403 won't fix itself, retry only server failures.
    onErrorRetry(error, _key, _config, revalidate, { retryCount }) {
      if (isClientError(error) || retryCount >= 3) {
        return;
      }
      setTimeout(() => revalidate({ retryCount }), 2000 * (retryCount + 1));
    },
  });
}

// After a change on the server: reloads everything the screens loaded from
// paths that start with `pathPrefix`. refreshApi("/api/bookings") covers
// the list and every single booking.
export function refreshApi(pathPrefix: string): Promise<unknown> {
  return mutate((key) => typeof key === "string" && key.startsWith(pathPrefix));
}

export function isNotFound(error: Error | undefined): boolean {
  return error instanceof ApiError && error.status === 404;
}

function isClientError(error: Error): boolean {
  return error instanceof ApiError && error.status < 500;
}
