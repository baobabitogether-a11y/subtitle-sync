import assert from "node:assert/strict";
import {
  getAudioTrackMode,
  setAudioTrackMode,
  getAvailableAudioTracks,
  findMatchingAudioTrack,
  repeatSegmentWithAudioTrack,
  AUDIO_TRACK_MODE_STORAGE_KEY,
} from "../src/utils/audioTrackManager";

console.log("====================================================");
console.log("🧪 Starting Audio-Track Mode Test Suite (Subtask 16.3)");
console.log("====================================================");

// Mock localStorage in Node environment
const storage = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, val: string) => storage.set(key, val),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
};

// Test 1: Default setting is OFF (false)
storage.clear();
const defaultVal = getAudioTrackMode();
assert.equal(defaultVal, false, "Default audio-track mode must be false (OFF)");
console.log("✅ PASS: Default audio-track mode is OFF (false)");

// Test 2: Persist state changes
setAudioTrackMode(true);
assert.equal(getAudioTrackMode(), true, "Should return true after enabling");
assert.equal(storage.get(AUDIO_TRACK_MODE_STORAGE_KEY), "true");
setAudioTrackMode(false);
assert.equal(getAudioTrackMode(), false, "Should return false after disabling");
console.log("✅ PASS: getAudioTrackMode & setAudioTrackMode correctly persist state");

// Test 3: Audio track resolution and matching
const mockTracks = [
  { id: "audio_en", languageCode: "en", displayName: "English [Original]" },
  { id: "audio_es", languageCode: "es", displayName: "Spanish (Spain)" },
  { id: "audio_ja", languageCode: "ja-JP", displayName: "Japanese" },
];

const mockPlayer = {
  getAvailableAudioTracks: () => mockTracks,
};

const tracks = getAvailableAudioTracks(mockPlayer);
assert.equal(tracks.length, 3);
assert.equal(tracks[0]?.id, "audio_en");

const matchEs = findMatchingAudioTrack(tracks, "es");
assert.equal(matchEs?.id, "audio_es");
const matchJa = findMatchingAudioTrack(tracks, "ja");
assert.equal(matchJa?.id, "audio_ja");
const matchNone = findMatchingAudioTrack(tracks, "de");
assert.equal(matchNone, undefined);
console.log("✅ PASS: findMatchingAudioTrack resolves language codes and prefixes");

// Test 4: repeatSegmentWithAudioTrack seeks and repeats segment with native audio
let currentTimeSec = 1.0;
let playCalled = false;
let pauseCalled = false;
let seekTargetSec = -1;
let activeTrackId = "audio_en";

const simulatedPlayer = {
  playVideo: () => {
    playCalled = true;
  },
  pauseVideo: () => {
    pauseCalled = true;
  },
  seekTo: (sec: number) => {
    seekTargetSec = sec;
    currentTimeSec = sec;
  },
  getCurrentTime: () => {
    currentTimeSec += 0.5; // Simulate time advancing
    return currentTimeSec;
  },
  getAvailableAudioTracks: () => mockTracks,
  getAudioTrack: () => ({ id: activeTrackId }),
  setAudioTrack: (id: string) => {
    activeTrackId = id;
  },
};

const progressEvents: number[] = [];
await repeatSegmentWithAudioTrack({
  player: simulatedPlayer,
  startMs: 1000,
  endMs: 2500,
  targetLangCode: "es",
  onProgress: (p) => progressEvents.push(p.percent),
});

assert.equal(seekTargetSec, 1.0, "Player should have sought to start of segment");
assert.equal(playCalled, true, "Player should have initiated playback");
assert.equal(pauseCalled, true, "Player should have paused upon segment completion");
assert.equal(activeTrackId, "audio_en", "Player should have restored original audio track");
assert.ok(progressEvents.length > 0, "Progress events should have been emitted");
console.log("✅ PASS: repeatSegmentWithAudioTrack executes segment repeat & restores audio track");

console.log("====================================================");
console.log("📊 AUDIO-TRACK MODE TEST SUMMARY: All tests passed!");
console.log("====================================================");
