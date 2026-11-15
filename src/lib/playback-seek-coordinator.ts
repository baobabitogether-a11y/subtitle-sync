export interface PendingSeekTarget {
  targetSec: number;
  requestedAt: number;
}

export interface TimedRowWindow {
  start: number;
  end: number;
}

/**
 * Find the active subtitle row index for a given playback time in milliseconds.
 * Returns -1 when no row covers `timeMs`.
 */
export function findRowIndexAtTimeMs(rows: readonly TimedRowWindow[], timeMs: number): number {
  if (!Number.isFinite(timeMs) || rows.length === 0) return -1;
  return rows.findIndex((r) => timeMs >= r.start && timeMs < r.end);
}

/**
 * Determine if the player is still settling into a recent programmatic seek
 * (e.g., YouTube iframe `seekTo` has not yet updated `getCurrentTime()`).
 * Returns true while `playerSec` is still far from `pending.targetSec` and
 * within `graceMs` (default 1200ms).
 */
export function isAwaitingPendingSeek(
  playerSec: number,
  pending: PendingSeekTarget | null | undefined,
  nowMs: number,
  graceMs = 1200,
): boolean {
  if (!pending) return false;
  if (nowMs - pending.requestedAt >= graceMs) return false;
  return Math.abs(playerSec - pending.targetSec) > 1.25;
}

/**
 * Resolve the effective current playback time in seconds, preferring a still-settling
 * pending seek target so rapid consecutive seeks (-5s / +5s / scrubbing) accumulate
 * cleanly instead of reading stale pre-seek `getCurrentTime()`.
 */
export function getEffectivePlayerTimeSec(
  playerSec: number,
  pending: PendingSeekTarget | null | undefined,
  nowMs: number,
  graceMs = 1200,
): number {
  if (isAwaitingPendingSeek(playerSec, pending, nowMs, graceMs) && pending) {
    return pending.targetSec;
  }
  return Number.isFinite(playerSec) ? Math.max(0, playerSec) : 0;
}

/**
 * Detect whether the player's reported timestamp jumped due to a manual user scrub
 * on the video progress bar (rather than normal continuous playback).
 * - While TTS-play is active (`isBusyForTts`), primary playback should stay near
 *   `lastMs` (or within the active speaking row in `audioTrackMode`), so any jump
 *   beyond 1500ms indicates a manual scrub.
 * - While video playback is running, any backward jump > 600ms or forward jump
 *   exceeding normal wall-clock playback progression indicates a manual scrub.
 */
export function detectManualProgressBarSeek(params: {
  ms: number;
  lastMs: number;
  wallElapsedMs: number;
  playbackRate: number;
  isBusyForTts: boolean;
  isAudioTrackMode: boolean;
  activeSpeakingRow?: TimedRowWindow | null;
}): boolean {
  const {
    ms,
    lastMs,
    wallElapsedMs,
    playbackRate,
    isBusyForTts,
    isAudioTrackMode,
    activeSpeakingRow,
  } = params;

  if (!Number.isFinite(ms) || !Number.isFinite(lastMs)) return false;

  if (isBusyForTts) {
    if (isAudioTrackMode && activeSpeakingRow) {
      return ms < activeSpeakingRow.start - 1500 || ms > activeSpeakingRow.end + 1500;
    }
    return Math.abs(ms - lastMs) > 1500;
  }

  const deltaMs = ms - lastMs;
  if (deltaMs < -600) {
    return true;
  }
  const safeRate = Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1;
  const clampedWallMs = Math.max(0, Math.min(wallElapsedMs, 5000));
  const maxExpectedForwardMs = Math.max(1500, clampedWallMs * safeRate + 1000);
  return deltaMs > maxExpectedForwardMs;
}

/**
 * Determine whether an in-flight TTS section completion is still allowed to resume
 * playback at its queued target (`rows[idx].start` for `tts-first` or `rows[candidateRow + 1].start`
 * for `video-first`), or whether a user seek or pause superseded it.
 */
export function shouldAbortQueuedSectionResume(params: {
  runEpoch: number;
  currentEpoch: number;
  wasCancelled: boolean;
  isSetupPaused: boolean;
  userExplicitlyPaused: boolean;
}): boolean {
  const { runEpoch, currentEpoch, wasCancelled, isSetupPaused, userExplicitlyPaused } = params;
  return wasCancelled || runEpoch !== currentEpoch || isSetupPaused || userExplicitlyPaused;
}
