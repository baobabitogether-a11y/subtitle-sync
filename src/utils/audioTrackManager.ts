export interface YTAudioTrack {
  id: string;
  languageCode?: string;
  displayName?: string;
  isDefault?: boolean;
}

export interface RepeatSegmentOptions {
  player: {
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getPlayerState?(): number;
    getAvailableAudioTracks?(): any[];
    setAudioTrack?(trackId: string): void;
    getAudioTrack?(): any;
  };
  startMs: number;
  endMs: number;
  targetLangCode?: string;
  onProgress?: (progress: { currentMs: number; totalMs: number; percent: number }) => void;
  checkCancelled?: () => boolean;
}

export const AUDIO_TRACK_MODE_STORAGE_KEY = "yt_audio_track_mode";

/**
 * Retrieve saved audio-track repeat mode setting. Defaults to false (OFF).
 */
export function getAudioTrackMode(): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    return window.localStorage.getItem(AUDIO_TRACK_MODE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Save audio-track repeat mode setting.
 */
export function setAudioTrackMode(enabled: boolean): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(AUDIO_TRACK_MODE_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Get normalized available audio tracks from the YouTube player if available.
 */
export function getAvailableAudioTracks(player: any): YTAudioTrack[] {
  if (!player || typeof player.getAvailableAudioTracks !== "function") {
    return [];
  }
  try {
    const raw = player.getAvailableAudioTracks() || [];
    return raw.map((track: any) => {
      if (typeof track === "string") {
        return { id: track, displayName: track };
      }
      return {
        id: track.id || track.audioTrackId || String(track),
        languageCode: track.languageCode || track.lang || track.id,
        displayName: track.displayName || track.name || track.label || track.id,
        isDefault: Boolean(track.isDefault),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Find matching audio track for a language code (e.g. "en", "es", "ja").
 */
export function findMatchingAudioTrack(
  tracks: YTAudioTrack[],
  langCode: string,
): YTAudioTrack | undefined {
  if (!tracks.length || !langCode) return undefined;
  const target = langCode.toLowerCase().trim();
  return tracks.find((track) => {
    const trackLang = (track.languageCode || track.id || "").toLowerCase();
    const trackName = (track.displayName || "").toLowerCase();
    return (
      trackLang === target ||
      trackLang.startsWith(`${target}-`) ||
      trackLang.startsWith(`${target}_`) ||
      trackName.includes(`(${target})`) ||
      trackName.includes(`[${target}]`)
    );
  });
}

/**
 * Repeat a video segment using the YouTube player's native audio track.
 * If the player provides multiple audio tracks matching the target language,
 * it switches to that track for the duration of the repeated segment.
 */
export function repeatSegmentWithAudioTrack(options: RepeatSegmentOptions): Promise<void> {
  const { player, startMs, endMs, targetLangCode, onProgress, checkCancelled } = options;

  return new Promise<void>((resolve) => {
    if (!player || typeof player.seekTo !== "function") {
      resolve();
      return;
    }

    const durationMs = Math.max(100, endMs - startMs);
    let originalTrackId: string | undefined;

    // Detect and switch audio track if available and requested
    if (targetLangCode && typeof player.getAvailableAudioTracks === "function") {
      try {
        const available = getAvailableAudioTracks(player);
        const match = findMatchingAudioTrack(available, targetLangCode);
        if (typeof player.getAudioTrack === "function") {
          const current = player.getAudioTrack();
          originalTrackId = current?.id || current;
        }
        if (match && typeof player.setAudioTrack === "function") {
          player.setAudioTrack(match.id);
        }
      } catch {
        // Continue even if audio track switching fails
      }
    }

    // Seek to start of segment and play
    player.seekTo(startMs / 1000, true);
    player.playVideo();

    const startTime = Date.now();
    const timeoutMs = durationMs + 8000; // Safety timeout

    const checkInterval = setInterval(() => {
      if (checkCancelled && checkCancelled()) {
        cleanup();
        resolve();
        return;
      }

      if (Date.now() - startTime > timeoutMs) {
        cleanup();
        resolve();
        return;
      }

      try {
        const currentMs = (player.getCurrentTime?.() ?? 0) * 1000;
        const elapsed = Math.max(0, currentMs - startMs);
        const percent = Math.min(100, Math.round((elapsed / durationMs) * 100));

        if (onProgress) {
          onProgress({ currentMs, totalMs: durationMs, percent });
        }

        if (currentMs >= endMs - 50) {
          cleanup();
          resolve();
        }
      } catch {
        cleanup();
        resolve();
      }
    }, 100);

    function cleanup() {
      clearInterval(checkInterval);
      try {
        player.pauseVideo();
        if (originalTrackId && typeof player.setAudioTrack === "function") {
          player.setAudioTrack(originalTrackId);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  });
}
