/**
 * Subtitle Cache Service (Neutralized / Cache Removed)
 * - In accordance with Task 42, subtitle caching is removed to simplify data flow,
 *   prevent cache invalidation issues, and guarantee that subtitles are always
 *   freshly fetched from live requests or authentic bundled demo fixtures.
 * - Legacy localStorage keys starting with `yt_subtitles_` are automatically purged.
 */

import { CaptionCue } from "../types";
import { cleanAndFixEncoding } from "./captionParser";
import { STORAGE_KEYS } from "../config/appConfig";
import { SAMPLE_AUTHENTIC_RUSSIAN_URL } from "../config/fixtures";
import {
  getCachedJson3ForVideoAndLanguage,
  hasCachedJson3ForVideoAndLanguage,
  getAllCachedLanguageCodesForVideo,
} from "../../test/fixtures/defaultSubtitles";

const SUBTITLE_CACHE_PREFIX = STORAGE_KEYS.SUBTITLE_CACHE_PREFIX;
const LAST_ACTIVE_VIDEO_KEY = STORAGE_KEYS.LAST_ACTIVE_VIDEO_KEY;

function isStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export interface CachedSubtitleData {
  videoId: string;
  cues: CaptionCue[];
  title?: string;
  originalUrl?: string;
  timestamp: number;
}

/**
 * Validate and clean cues array to ensure proper text encoding
 */
export function sanitizeCues(cues: CaptionCue[]): CaptionCue[] {
  if (!Array.isArray(cues)) return [];
  return cues
    .filter((cue) => cue && typeof cue.text === "string" && typeof cue.start === "number")
    .map((cue, idx) => ({
      id: cue.id || `cue-${idx + 1}`,
      start: Number(cue.start) || 0,
      duration: Math.max(0.5, Number(cue.duration) || 2),
      text: cleanAndFixEncoding(cue.text),
    }));
}

/**
 * Get cached subtitles for a given YouTube video ID.
 * Subtitle caching is removed to simplify data flow; always returns null
 * to guarantee subtitles are freshly retrieved.
 */
export function getCachedSubtitles(_videoId: string): CaptionCue[] | null {
  // Caching removed: always return null to enforce fresh subtitle retrieval
  return null;
}

/**
 * Checks if non-empty cached subtitles exist for a video ID.
 * Always returns false since caching is disabled.
 */
export function hasCachedSubtitles(_videoId: string): boolean {
  return false;
}

/**
 * Persist subtitles for a video.
 * No-op: caching is removed to prevent stale subtitle tracks in localStorage.
 */
export function saveCachedSubtitles(
  _videoId: string,
  _cues: CaptionCue[],
  _meta?: { title?: string; originalUrl?: string },
): void {
  // No-op: subtitle caching is removed to simplify data flow
}

/**
 * Remember the last active video ID and URL
 */
export function saveLastActiveVideo(videoId: string, url: string): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(
      LAST_ACTIVE_VIDEO_KEY,
      JSON.stringify({ videoId, url, timestamp: Date.now() }),
    );
  } catch {}
}

/**
 * Get the last active video from previous session
 */
export function getLastActiveVideo(): { videoId: string; url: string } | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_VIDEO_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.videoId) {
        return {
          videoId: parsed.videoId,
          url: parsed.url || `https://www.youtube.com/watch?v=${parsed.videoId}`,
        };
      }
    }
  } catch {}
  return null;
}

const TIMEDTEXT_URL_PREFIX = STORAGE_KEYS.TIMEDTEXT_URL_PREFIX;

// In-memory observed timedtext requests
const observedTimedTextCache = new Map<string, string>();

// Example observed JSON3 timedtext request URL
export const SAMPLE_OBSERVED_TIMEDTEXT_URL = SAMPLE_AUTHENTIC_RUSSIAN_URL;

export function saveObservedTimedTextUrl(videoId: string, url: string): void {
  if (!videoId || !url) return;
  observedTimedTextCache.set(videoId, url);
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(`${TIMEDTEXT_URL_PREFIX}${videoId}`, url);
  } catch {}
}

export function getObservedTimedTextUrl(videoId: string): string | null {
  if (!videoId) return null;
  if (observedTimedTextCache.has(videoId)) {
    return observedTimedTextCache.get(videoId)!;
  }
  if (isStorageAvailable()) {
    try {
      const saved = localStorage.getItem(`${TIMEDTEXT_URL_PREFIX}${videoId}`);
      if (saved) {
        observedTimedTextCache.set(videoId, saved);
        return saved;
      }
    } catch {}
  }

  return null;
}

/**
 * Returns authentic Hebrew subtitles for the default JSON3 demo video.
 */
export function getAuthenticHebrewCuesForDefaultVideo(): CaptionCue[] {
  const json3Cues = getCachedJson3ForVideoAndLanguage("L2Ryrr6txwA", "he");
  return json3Cues || [];
}

/**
 * Checks if target language subtitles exist in bundled fixtures for a video ID
 */
export function hasCachedTargetSubtitles(videoId: string, targetLang: string): boolean {
  if (!videoId || !targetLang) return false;
  let cleanLang = targetLang.toLowerCase().split("-")[0];
  if (cleanLang === "iw" || cleanLang === "il") cleanLang = "he";
  return hasCachedJson3ForVideoAndLanguage(videoId, cleanLang);
}

/**
 * Gets target language subtitles for a video ID from bundled JSON3 demo fixtures only
 */
export function getCachedTargetSubtitles(videoId: string, targetLang: string): CaptionCue[] | null {
  if (!videoId || !targetLang) return null;
  let cleanLang = targetLang.toLowerCase().split("-")[0];
  if (cleanLang === "iw" || cleanLang === "il") cleanLang = "he";

  // Only return authentic bundled JSON3 demo fixtures; no localStorage caching
  const json3Cues = getCachedJson3ForVideoAndLanguage(videoId, cleanLang);
  if (json3Cues && json3Cues.length > 0) {
    return sanitizeCues(json3Cues);
  }
  return null;
}

/**
 * Saves cached target language subtitles for a video ID.
 * No-op: caching is removed to prevent stale subtitle tracks in localStorage.
 */
export function saveCachedTargetSubtitles(
  _videoId: string,
  _targetLang: string,
  _cues: CaptionCue[],
): void {
  // No-op: subtitle caching is removed to simplify data flow
}

/**
 * Lists all target languages with bundled JSON3 tracks for a given demo video
 */
export function getAllCachedTargetLanguages(videoId: string): string[] {
  if (!videoId) return [];
  const fixtureLangs = getAllCachedLanguageCodesForVideo(videoId);
  if (Array.isArray(fixtureLangs)) {
    return fixtureLangs.map((c) => c.toLowerCase());
  }
  return [];
}

/**
 * Purges legacy in-memory and localStorage subtitle caches
 */
export function clearSubtitleCache(): void {
  observedTimedTextCache.clear();
  if (!isStorageAvailable()) return;
  try {
    const storage = window.localStorage;
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(SUBTITLE_CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => storage.removeItem(k));
  } catch {}
}
