export type SubtitleFetchStatus = "idle" | "fetching" | "completed" | "error";

export interface SubtitleFetchNotification {
  id: string;
  status: SubtitleFetchStatus;
  message: string;
  langCode?: string;
  langName?: string;
  timestamp: number;
}

const STORAGE_KEY = "subtitles_fetch_notifications_muted";

let memoryMuted = false;

export function isSubtitleNotificationMuted(): boolean {
  if (typeof window === "undefined") {
    return memoryMuted;
  }
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val !== null ? val === "true" : memoryMuted;
  } catch {
    return memoryMuted;
  }
}

export function setSubtitleNotificationMuted(muted: boolean): void {
  memoryMuted = muted;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, muted ? "true" : "false");
    } catch {
      // Ignore storage errors
    }
  }
}

type Listener = (notification: SubtitleFetchNotification | null) => void;
const listeners = new Set<Listener>();
let currentNotification: SubtitleFetchNotification | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export function notifySubtitleFetch(
  status: SubtitleFetchStatus,
  message: string,
  langCode?: string,
  langName?: string,
): void {
  if (status === "idle") {
    currentNotification = null;
    listeners.forEach((fn) => fn(null));
    return;
  }

  if (isSubtitleNotificationMuted()) {
    return;
  }

  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }

  currentNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status,
    message,
    langCode,
    langName,
    timestamp: Date.now(),
  };

  listeners.forEach((fn) => fn(currentNotification));

  // Auto-dismiss completed notifications after 6 seconds
  if (status === "completed" || status === "error") {
    dismissTimer = setTimeout(() => {
      dismissSubtitleNotification();
    }, 6000);
  }
}

export function dismissSubtitleNotification(): void {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
  currentNotification = null;
  listeners.forEach((fn) => fn(null));
}

export function subscribeSubtitleNotification(listener: Listener): () => void {
  listeners.add(listener);
  listener(currentNotification);
  return () => {
    listeners.delete(listener);
  };
}
