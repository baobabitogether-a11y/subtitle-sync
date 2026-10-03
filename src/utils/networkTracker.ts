import { useSyncExternalStore } from "react";

export interface NetworkRequestRecord {
  id: string;
  url: string;
  method: string;
  type: "fetch" | "timedtext_interception" | "native_bridge";
  startTime: number;
  duration?: number;
  status: number;
  responseBodyPreview?: string; // Strictly first X=250 characters
  fullResponseBody?: string; // Complete raw or formatted response body
  error?: string;
  isPending?: boolean;
}

export const MAX_RESPONSE_BODY_PREVIEW_CHARS = 250;

/**
 * Truncate response body strictly to the first X=250 characters
 */
export function truncateResponseBody(
  body: unknown,
  maxChars = MAX_RESPONSE_BODY_PREVIEW_CHARS,
): string {
  if (body === undefined || body === null) return "";
  const str = typeof body === "string" ? body : JSON.stringify(body);
  return str.slice(0, maxChars);
}

// Backward compatibility aliases
export const truncateToFirst15Chars = truncateResponseBody;
export const truncateToFirst50Chars = truncateResponseBody;
export const truncateToFirst200Chars = truncateResponseBody;
export const truncateToFirst250Chars = truncateResponseBody;

let requests: NetworkRequestRecord[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function trackNetworkRequest(
  url: string,
  method = "GET",
  type: "fetch" | "timedtext_interception" | "native_bridge" = "fetch",
) {
  const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startTime = Date.now();

  const record: NetworkRequestRecord = {
    id,
    url,
    method,
    type,
    startTime,
    status: 0,
    isPending: true,
  };

  requests = [record, ...requests.slice(0, 99)];
  notify();

  return {
    id,
    complete: (status: number, responseBody?: unknown) => {
      const duration = Date.now() - startTime;
      const fullStr =
        responseBody === undefined || responseBody === null
          ? ""
          : typeof responseBody === "string"
            ? responseBody
            : JSON.stringify(responseBody, null, 2);
      const preview = truncateResponseBody(fullStr, MAX_RESPONSE_BODY_PREVIEW_CHARS);
      requests = requests.map((req) =>
        req.id === id
          ? {
              ...req,
              status,
              duration,
              isPending: false,
              responseBodyPreview: preview,
              fullResponseBody: fullStr,
            }
          : req,
      );
      notify();
    },
    fail: (error: string) => {
      const duration = Date.now() - startTime;
      requests = requests.map((req) =>
        req.id === id
          ? {
              ...req,
              error,
              duration,
              isPending: false,
              status: 0,
            }
          : req,
      );
      notify();
    },
  };
}

export function clearNetworkRequests() {
  requests = [];
  notify();
}

export function getNetworkRequests(): NetworkRequestRecord[] {
  return requests;
}

export function subscribeToNetworkRequests(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useNetworkRequests(): NetworkRequestRecord[] {
  return useSyncExternalStore(subscribeToNetworkRequests, getNetworkRequests, () => []);
}
