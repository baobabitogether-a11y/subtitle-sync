/** Device-saved playback/fetch preferences (localStorage). */

export type SubtitleRequestMode = "tlang" | "lang";
export type SectionOrder = "video-first" | "tts-first";
export type PlayerKind = "youtube-api" | "iframe";

const KEYS = {
  requestMode: "yt_subtitle_request_mode_v1",
  sectionOrder: "yt_section_order_v1",
  playerKind: "yt_player_kind_v1",
} as const;

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
}

/** Primary request mode; the other one is used as the fallback. */
export const getSubtitleRequestMode = () =>
  read<SubtitleRequestMode>(KEYS.requestMode, ["tlang", "lang"], "tlang");
export const setSubtitleRequestMode = (m: SubtitleRequestMode) => write(KEYS.requestMode, m);
/** Primary first, then fallback. */
export const subtitleRequestModeOrder = (primary: SubtitleRequestMode): SubtitleRequestMode[] =>
  primary === "tlang" ? ["tlang", "lang"] : ["lang", "tlang"];

export const getSectionOrder = () =>
  read<SectionOrder>(KEYS.sectionOrder, ["video-first", "tts-first"], "video-first");
export const setSectionOrder = (o: SectionOrder) => write(KEYS.sectionOrder, o);

export const getPlayerKind = () =>
  read<PlayerKind>(KEYS.playerKind, ["youtube-api", "iframe"], "youtube-api");
export const setPlayerKind = (k: PlayerKind) => write(KEYS.playerKind, k);
