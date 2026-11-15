import { LANGS, type Json3 } from "@/lib/subtitles";
import { buildTranslatedCaptionUrl } from "@/lib/native-captions";
import type { VideoCaptionTrackInfo } from "@/types";
import { extractLang, extractTlang, type NetworkRequestRecord } from "@/utils/networkTracker";

export type YouTubeApiSubtitleKind = "default" | "auto-translation" | "asr" | "caption";

export type YouTubeApiSubtitleSource =
  | "timedtext_list_api"
  | "timedtext_request"
  | "observed_url"
  | "youtube_translated_tracks"
  | "detected_track";

export interface YouTubeApiSubtitleEntry {
  id: string;
  langCode: string;
  normalizedLangCode: string;
  name: string;
  kind: YouTubeApiSubtitleKind;
  isDefault: boolean;
  isAutoTranslation: boolean;
  isAsr: boolean;
  isLoaded: boolean;
  cuesCount: number;
  sourceLang?: string;
  source: YouTubeApiSubtitleSource;
  requestUrl?: string;
  status?: number;
}

export interface YouTubeApiSubtitleSummary {
  entries: YouTubeApiSubtitleEntry[];
  defaultEntry: YouTubeApiSubtitleEntry | null;
  autoTranslationCount: number;
  asrCount: number;
  hasApiActivity: boolean;
  trackListRequestStatus?: number;
}

export interface BuildYouTubeApiSubtitleTracksParams {
  videoId?: string;
  availableCaptionTracks?: VideoCaptionTrackInfo[];
  defaultApiLang?: string;
  observedUrl?: string;
  youtubeTranslatedLanguages?: string[];
  networkRequests?: NetworkRequestRecord[];
  tracks?: Record<string, Json3> | null;
  detectedTracks?: Record<
    string,
    {
      lang: string;
      langName?: string;
      url?: string;
      cuesCount?: number;
      json?: Json3;
    }
  >;
}

export function normalizeYouTubeApiLangCode(code?: string | null): string {
  const trimmed = (code || "").trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase() === "iw") return "he";
  const matched = LANGS.find((l) => l.code.toLowerCase() === trimmed.toLowerCase());
  return matched ? matched.code : trimmed;
}

export function isSameYouTubeApiLang(a?: string | null, b?: string | null): boolean {
  const na = normalizeYouTubeApiLangCode(a).toLowerCase();
  const nb = normalizeYouTubeApiLangCode(b).toLowerCase();
  return Boolean(na && nb && na === nb);
}

function getLangDisplayName(code: string, fallbackName?: string): string {
  const normalized = normalizeYouTubeApiLangCode(code);
  const meta = LANGS.find((l) => l.code.toLowerCase() === normalized.toLowerCase());
  if (fallbackName && fallbackName.trim() && fallbackName.toLowerCase() !== code.toLowerCase()) {
    return fallbackName.trim();
  }
  return meta?.name || fallbackName || normalized.toUpperCase();
}

function isYouTubeTimedTextUrl(rawUrl?: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  try {
    const parsed = new URL(rawUrl, "https://www.youtube.com");
    const host = parsed.hostname.toLowerCase();
    const isYtHost = host === "youtube.com" || host.endsWith(".youtube.com");
    return isYtHost && parsed.pathname.includes("/api/timedtext");
  } catch {
    return rawUrl.includes("/api/timedtext");
  }
}

function matchesVideoIdIfPresent(rawUrl: string, videoId?: string): boolean {
  if (!videoId) return true;
  try {
    const parsed = new URL(rawUrl, "https://www.youtube.com");
    const vParam = parsed.searchParams.get("v");
    if (!vParam) return true;
    return vParam === videoId;
  } catch {
    return true;
  }
}

function countLoadedCues(
  langCode: string,
  tracks?: Record<string, Json3> | null,
  detectedTracks?: BuildYouTubeApiSubtitleTracksParams["detectedTracks"],
): { isLoaded: boolean; cuesCount: number } {
  const normalized = normalizeYouTubeApiLangCode(langCode);
  let cuesCount = 0;

  if (tracks) {
    const entryKey = Object.keys(tracks).find((k) => isSameYouTubeApiLang(k, normalized));
    const json = entryKey ? tracks[entryKey] : undefined;
    if (json?.events && Array.isArray(json.events)) {
      cuesCount = json.events.filter((ev) => ev.segs?.some((s) => s.utf8?.trim())).length;
      if (cuesCount === 0 && json.events.length > 0) {
        cuesCount = json.events.length;
      }
    } else if (Array.isArray(json)) {
      cuesCount = (json as unknown[]).length;
    }
  }

  if (cuesCount === 0 && detectedTracks) {
    const detKey = Object.keys(detectedTracks).find((k) => isSameYouTubeApiLang(k, normalized));
    const det = detKey ? detectedTracks[detKey] : undefined;
    if (det) {
      cuesCount =
        det.cuesCount ||
        det.json?.events?.filter((ev) => ev.segs?.some((s) => s.utf8?.trim())).length ||
        det.json?.events?.length ||
        0;
    }
  }

  return {
    isLoaded: cuesCount > 0,
    cuesCount,
  };
}

function kindBucket(kind: YouTubeApiSubtitleKind): string {
  if (kind === "auto-translation") return "auto-translation";
  if (kind === "asr") return "asr";
  return "default-or-caption";
}

function kindPriority(entry: YouTubeApiSubtitleEntry): number {
  if (entry.isDefault || entry.kind === "default") return 0;
  if (entry.kind === "asr" || entry.isAsr) return 1;
  if (entry.isAutoTranslation || entry.kind === "auto-translation") return 2;
  return 3;
}

/**
 * Aggregates and classifies the active video's YouTube API Default, Auto (ASR),
 * and Auto-Translation (`tlang`) subtitle tracks from real API sources:
 * - `youtube.com/api/timedtext?type=list` (`availableCaptionTracks`, `defaultApiLang`)
 * - Captured `api/timedtext` network requests (`networkRequests`)
 * - Live `observedUrl` and `detectedTracks`
 * - `youtubeTranslatedLanguages`
 *
 * Strictly zero hardcoded subtitle tracks or cues.
 */
export function buildYouTubeApiSubtitleSummary(
  params: BuildYouTubeApiSubtitleTracksParams,
): YouTubeApiSubtitleSummary {
  const {
    videoId,
    availableCaptionTracks,
    defaultApiLang,
    observedUrl,
    youtubeTranslatedLanguages,
    networkRequests,
    tracks,
    detectedTracks,
  } = params;

  const entryMap = new Map<string, YouTubeApiSubtitleEntry>();
  let trackListRequestStatus: number | undefined;
  let hasApiActivity = false;

  const upsertEntry = (candidate: Omit<YouTubeApiSubtitleEntry, "id">) => {
    const normalized = normalizeYouTubeApiLangCode(candidate.langCode);
    if (!normalized) return;

    const bucket = kindBucket(candidate.kind);
    const id = `${bucket}:${normalized.toLowerCase()}`;
    const existing = entryMap.get(id);
    const loadedInfo = countLoadedCues(normalized, tracks, detectedTracks);

    if (!existing) {
      entryMap.set(id, {
        ...candidate,
        id,
        langCode: normalized,
        normalizedLangCode: normalized,
        name: getLangDisplayName(normalized, candidate.name),
        isLoaded: loadedInfo.isLoaded || candidate.isLoaded,
        cuesCount: Math.max(loadedInfo.cuesCount, candidate.cuesCount || 0),
      });
      return;
    }

    entryMap.set(id, {
      ...existing,
      name:
        candidate.name && candidate.name.toLowerCase() !== normalized.toLowerCase()
          ? candidate.name
          : existing.name,
      isDefault: existing.isDefault || candidate.isDefault,
      isAutoTranslation: existing.isAutoTranslation || candidate.isAutoTranslation,
      isAsr: existing.isAsr || candidate.isAsr,
      kind:
        existing.isAutoTranslation || candidate.isAutoTranslation
          ? "auto-translation"
          : existing.isDefault || candidate.isDefault
            ? "default"
            : existing.isAsr || candidate.isAsr
              ? "asr"
              : "caption",
      isLoaded: existing.isLoaded || loadedInfo.isLoaded || candidate.isLoaded,
      cuesCount: Math.max(existing.cuesCount, loadedInfo.cuesCount, candidate.cuesCount || 0),
      sourceLang: existing.sourceLang || candidate.sourceLang,
      requestUrl: existing.requestUrl || candidate.requestUrl,
      status: candidate.status || existing.status,
    });
  };

  // 1. YouTube timedtext?type=list tracks (`availableCaptionTracks`)
  if (Array.isArray(availableCaptionTracks) && availableCaptionTracks.length > 0) {
    hasApiActivity = true;
    for (const apiTrack of availableCaptionTracks) {
      if (!apiTrack?.langCode) continue;
      const isAsr = Boolean(apiTrack.isAsr);
      const isDefault =
        !isAsr &&
        (Boolean(apiTrack.isDefault) || isSameYouTubeApiLang(apiTrack.langCode, defaultApiLang));
      const kind: YouTubeApiSubtitleKind = isAsr ? "asr" : isDefault ? "default" : "caption";

      upsertEntry({
        langCode: apiTrack.langCode,
        normalizedLangCode: normalizeYouTubeApiLangCode(apiTrack.langCode),
        name: apiTrack.name || apiTrack.langCode,
        kind,
        isDefault,
        isAutoTranslation: false,
        isAsr,
        isLoaded: false,
        cuesCount: 0,
        source: "timedtext_list_api",
        requestUrl: apiTrack.trackUrl,
      });
    }
  }

  // 2. Captured YouTube `/api/timedtext` requests from `networkRequests`
  let baseApiUrl =
    observedUrl &&
    isYouTubeTimedTextUrl(observedUrl) &&
    matchesVideoIdIfPresent(observedUrl, videoId)
      ? observedUrl
      : undefined;

  if (Array.isArray(networkRequests)) {
    for (const req of networkRequests) {
      if (!req?.url || !isYouTubeTimedTextUrl(req.url)) continue;
      if (!matchesVideoIdIfPresent(req.url, videoId)) continue;

      let parsedUrl: URL | null = null;
      try {
        parsedUrl = new URL(req.url, "https://www.youtube.com");
      } catch {
        parsedUrl = null;
      }

      if (parsedUrl?.searchParams.get("type") === "list") {
        hasApiActivity = true;
        if (req.status > 0) trackListRequestStatus = req.status;
        continue;
      }

      hasApiActivity = true;
      const tlang = extractTlang(req.url);
      const lang = extractLang(req.url);
      const kindParam = parsedUrl?.searchParams.get("kind") || "";
      const capsParam = parsedUrl?.searchParams.get("caps") || "";
      const nameParam = parsedUrl?.searchParams.get("name") || "";

      if (tlang) {
        upsertEntry({
          langCode: tlang,
          normalizedLangCode: normalizeYouTubeApiLangCode(tlang),
          name: getLangDisplayName(tlang),
          kind: "auto-translation",
          isDefault: false,
          isAutoTranslation: true,
          isAsr: false,
          isLoaded: req.status === 200 && Boolean(req.fullResponseBody?.trim()),
          cuesCount: 0,
          sourceLang: lang ? normalizeYouTubeApiLangCode(lang) : defaultApiLang,
          source: "timedtext_request",
          requestUrl: req.url,
          status: req.status > 0 ? req.status : undefined,
        });
      } else if (lang) {
        if (!baseApiUrl) baseApiUrl = req.url;
        const isAsr =
          kindParam === "asr" ||
          capsParam === "asr" ||
          nameParam.toLowerCase().includes("auto-generated");
        const isDefault = !isAsr && (isSameYouTubeApiLang(lang, defaultApiLang) || !defaultApiLang);
        upsertEntry({
          langCode: lang,
          normalizedLangCode: normalizeYouTubeApiLangCode(lang),
          name: nameParam || getLangDisplayName(lang),
          kind: isAsr ? "asr" : isDefault ? "default" : "caption",
          isDefault,
          isAutoTranslation: false,
          isAsr,
          isLoaded: req.status === 200 && Boolean(req.fullResponseBody?.trim()),
          cuesCount: 0,
          source: "timedtext_request",
          requestUrl: req.url,
          status: req.status > 0 ? req.status : undefined,
        });
      }
    }
  }

  // 3. Observed timedtext URL from player / bridge interception
  if (
    observedUrl &&
    isYouTubeTimedTextUrl(observedUrl) &&
    matchesVideoIdIfPresent(observedUrl, videoId)
  ) {
    hasApiActivity = true;
    const tlang = extractTlang(observedUrl);
    const lang = extractLang(observedUrl);
    let parsedObs: URL | null = null;
    try {
      parsedObs = new URL(observedUrl, "https://www.youtube.com");
    } catch {
      parsedObs = null;
    }
    const isAsr =
      parsedObs?.searchParams.get("kind") === "asr" ||
      parsedObs?.searchParams.get("caps") === "asr";

    if (tlang) {
      upsertEntry({
        langCode: tlang,
        normalizedLangCode: normalizeYouTubeApiLangCode(tlang),
        name: getLangDisplayName(tlang),
        kind: "auto-translation",
        isDefault: false,
        isAutoTranslation: true,
        isAsr: false,
        isLoaded: false,
        cuesCount: 0,
        sourceLang: lang ? normalizeYouTubeApiLangCode(lang) : defaultApiLang,
        source: "observed_url",
        requestUrl: observedUrl,
      });
    } else if (lang) {
      upsertEntry({
        langCode: lang,
        normalizedLangCode: normalizeYouTubeApiLangCode(lang),
        name: getLangDisplayName(lang),
        kind: isAsr ? "asr" : "default",
        isDefault: !isAsr,
        isAutoTranslation: false,
        isAsr,
        isLoaded: false,
        cuesCount: 0,
        source: "observed_url",
        requestUrl: observedUrl,
      });
    }
  }

  // 4. Detected tracks with explicit YouTube timedtext URLs
  if (detectedTracks) {
    for (const det of Object.values(detectedTracks)) {
      if (!det?.lang || !det.url || !isYouTubeTimedTextUrl(det.url)) continue;
      if (!matchesVideoIdIfPresent(det.url, videoId)) continue;
      hasApiActivity = true;
      const tlang = extractTlang(det.url);
      const srcLang = extractLang(det.url);
      let isAsr = false;
      try {
        const u = new URL(det.url, "https://www.youtube.com");
        isAsr = u.searchParams.get("kind") === "asr" || u.searchParams.get("caps") === "asr";
      } catch {
        isAsr = det.url.includes("kind=asr");
      }

      if (tlang) {
        upsertEntry({
          langCode: tlang,
          normalizedLangCode: normalizeYouTubeApiLangCode(tlang),
          name: det.langName || getLangDisplayName(tlang),
          kind: "auto-translation",
          isDefault: false,
          isAutoTranslation: true,
          isAsr: false,
          isLoaded: Boolean(det.cuesCount && det.cuesCount > 0),
          cuesCount: det.cuesCount || 0,
          sourceLang: srcLang ? normalizeYouTubeApiLangCode(srcLang) : defaultApiLang,
          source: "detected_track",
          requestUrl: det.url,
        });
      } else {
        const isDefault = !isAsr && isSameYouTubeApiLang(det.lang, defaultApiLang);
        upsertEntry({
          langCode: det.lang,
          normalizedLangCode: normalizeYouTubeApiLangCode(det.lang),
          name: det.langName || getLangDisplayName(det.lang),
          kind: isAsr ? "asr" : isDefault ? "default" : "caption",
          isDefault,
          isAutoTranslation: false,
          isAsr,
          isLoaded: Boolean(det.cuesCount && det.cuesCount > 0),
          cuesCount: det.cuesCount || 0,
          source: "detected_track",
          requestUrl: det.url,
        });
      }
    }
  }

  // 5. Explicitly tracked YouTube Auto-Translation (`tlang=`) languages
  if (Array.isArray(youtubeTranslatedLanguages)) {
    for (const tCode of youtubeTranslatedLanguages) {
      if (!tCode) continue;
      hasApiActivity = true;
      const normalized = normalizeYouTubeApiLangCode(tCode);
      const fallbackUrl = baseApiUrl
        ? buildTranslatedCaptionUrl(baseApiUrl, normalized, "json3")
        : undefined;
      const sourceLang = baseApiUrl
        ? normalizeYouTubeApiLangCode(extractLang(baseApiUrl)) || defaultApiLang
        : defaultApiLang;
      upsertEntry({
        langCode: normalized,
        normalizedLangCode: normalized,
        name: getLangDisplayName(normalized),
        kind: "auto-translation",
        isDefault: false,
        isAutoTranslation: true,
        isAsr: false,
        isLoaded: false,
        cuesCount: 0,
        sourceLang: sourceLang || undefined,
        source: "youtube_translated_tracks",
        requestUrl: fallbackUrl,
      });
    }
  }

  const entries = Array.from(entryMap.values())
    .map((entry) => ({
      ...entry,
      id: `${entry.kind}:${entry.normalizedLangCode.toLowerCase()}`,
    }))
    .sort((a, b) => kindPriority(a) - kindPriority(b));

  // Ensure a defaultEntry is promoted if we have an explicit default or observed base track
  let defaultEntry = entries.find((e) => e.isDefault) || null;
  if (!defaultEntry && defaultApiLang) {
    defaultEntry =
      entries.find(
        (e) => isSameYouTubeApiLang(e.langCode, defaultApiLang) && !e.isAutoTranslation,
      ) || null;
    if (defaultEntry) {
      defaultEntry.isDefault = true;
      if (defaultEntry.kind === "caption") {
        defaultEntry.kind = "default";
        defaultEntry.id = `default:${defaultEntry.normalizedLangCode.toLowerCase()}`;
      }
    }
  }

  return {
    entries,
    defaultEntry,
    autoTranslationCount: entries.filter((e) => e.isAutoTranslation).length,
    asrCount: entries.filter((e) => e.isAsr).length,
    hasApiActivity,
    trackListRequestStatus,
  };
}

export function buildYouTubeApiSubtitleTracks(
  params: BuildYouTubeApiSubtitleTracksParams,
): YouTubeApiSubtitleEntry[] {
  return buildYouTubeApiSubtitleSummary(params).entries;
}
