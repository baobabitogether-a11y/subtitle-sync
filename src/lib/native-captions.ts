import type { Json3 } from "./subtitles";

export type NativeShell = {
  isNativeShell(): boolean;
  getLastObservedTimedTextUrl(): string;
  fetchTranslatedCaptionsWithUrl(url: string, language: string, format: string): string;
};

export function nativeShell(): NativeShell | null {
  if (typeof window === "undefined") return null;
  const bridge = (window as Window & { AndroidNativeShell?: NativeShell }).AndroidNativeShell;
  try {
    return bridge?.isNativeShell() ? bridge : null;
  } catch {
    return null;
  }
}

export function decodeInterceptedCaption(payload: string): { url: string; rawData: string } | null {
  try {
    const bytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
    const value = JSON.parse(new TextDecoder().decode(bytes));
    return typeof value.url === "string" && typeof value.rawData === "string" ? value : null;
  } catch {
    return null;
  }
}

export function parseJson3(raw: string): Json3 | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();

  // 1. Try standard JSON3 parse
  if (trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed) as Json3;
      if (
        Array.isArray(data.events) &&
        data.events.some((event) => event.segs?.some((s) => s.utf8?.trim()))
      ) {
        return data;
      }
    } catch {
      // Continue to XML parser
    }
  }

  // 2. Resilient XML Fallback parser for timedtext XML / format 3 / transcript
  try {
    const textMatches = Array.from(trimmed.matchAll(/<text\b([^>]*)>(.*?)<\/text>/gis));
    if (textMatches.length > 0) {
      const events: Json3["events"] = [];
      for (const match of textMatches) {
        const attrs = match[1];
        const content = match[2]
          .replace(/<[^>]*>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
        if (!content) continue;
        const startSec = parseFloat(attrs.match(/start=["']([0-9.]+)["']/i)?.[1] || "0");
        const durSec = parseFloat(attrs.match(/dur=["']([0-9.]+)["']/i)?.[1] || "2");
        events.push({
          tStartMs: Math.round(startSec * 1000),
          dDurationMs: Math.round(durSec * 1000),
          segs: [{ utf8: content }],
        });
      }
      if (events.length > 0) {
        return { events };
      }
    }

    const pMatches = Array.from(trimmed.matchAll(/<p\b([^>]*)>(.*?)<\/p>/gis));
    if (pMatches.length > 0) {
      const events: Json3["events"] = [];
      for (const match of pMatches) {
        const attrs = match[1];
        const content = match[2]
          .replace(/<[^>]*>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
        if (!content) continue;
        const startMs = parseInt(attrs.match(/t=["']([0-9]+)["']/i)?.[1] || "0", 10);
        const durMs = parseInt(attrs.match(/d=["']([0-9]+)["']/i)?.[1] || "2000", 10);
        events.push({
          tStartMs: startMs,
          dDurationMs: durMs,
          segs: [{ utf8: content }],
        });
      }
      if (events.length > 0) {
        return { events };
      }
    }
  } catch {
    // Ignore XML parse errors
  }

  return null;
}

export function timedTextVideoId(url: string): string | null {
  try {
    return new URL(url).searchParams.get("v");
  } catch {
    return null;
  }
}

export function parseVideoId(value: string): string | null {
  const text = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;
  try {
    const url = new URL(text);
    if (
      !["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"].includes(
        url.hostname,
      )
    )
      return null;
    const id = url.hostname.endsWith("youtu.be")
      ? url.pathname.slice(1).split("/")[0]
      : (url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1]);
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function buildTranslatedCaptionUrl(
  baseUrl: string,
  targetLanguage: string,
  format = "json3",
): string {
  try {
    const url = new URL(baseUrl);
    const originalLang = url.searchParams.get("lang");
    if (originalLang && originalLang.toLowerCase() === targetLanguage.toLowerCase()) {
      url.searchParams.delete("tlang");
    } else {
      url.searchParams.set("tlang", targetLanguage);
    }
    if (format) {
      url.searchParams.set("fmt", format);
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}
