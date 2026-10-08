/**
 * Verification test for Subtask 49.1: Multi-Instance Video Player State & Independent Configuration Architecture.
 * Validates:
 * 1. Independent instance configuration mapping (primary + each spoken language).
 * 2. Independent state persistence per video element without cross-instance leakage.
 * 3. MultiVideoPlayerRegistry player isolation, pauseAllExcept, and unmuteOnly coordination.
 */

import assert from "node:assert";
import {
  computeVideoInstances,
  loadStoredInstanceConfigs,
  saveVideoInstanceConfig,
  MultiVideoPlayerRegistry,
  type YTPlayerLike,
} from "../src/utils/multiVideoPlayerManager";

console.log("====================================================");
console.log("🧪 Running Subtask 49.1: Multi-Instance Video Player State Verification");
console.log("====================================================");

// Mock localStorage for node environment
const storageMock: Record<string, string> = {};
(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storageMock[key] ?? null,
    setItem: (key: string, value: string) => {
      storageMock[key] = value;
    },
    removeItem: (key: string) => {
      delete storageMock[key];
    },
    clear: () => {
      for (const k in storageMock) delete storageMock[k];
    },
  },
};

const languagesCatalog = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "he", name: "Hebrew" },
  { code: "fr", name: "French" },
];

// Test 1: Compute instances correctly creates primary + spoken language instances
console.log("Test 1: Compute instances creates primary + spoken language instances...");
const instances1 = computeVideoInstances(["es", "he"], languagesCatalog, "test_video_1");
assert.strictEqual(instances1.length, 3, "Expected 3 instances: primary, es, and he");
assert.strictEqual(instances1[0].id, "primary");
assert.strictEqual(instances1[0].isPrimary, true);
assert.strictEqual(instances1[1].id, "lang_es");
assert.strictEqual(instances1[1].languageCode, "es");
assert.strictEqual(instances1[1].label, "Spanish Audio Track");
assert.strictEqual(instances1[2].id, "lang_he");
assert.strictEqual(instances1[2].languageCode, "he");
assert.strictEqual(instances1[2].label, "Hebrew Audio Track");
console.log("✅ PASS: computeVideoInstances generated distinct instances with clear labels");

// Test 2: Independent storage per instance does not cross-contaminate
console.log("Test 2: Independent storage per instance does not cross-contaminate...");
saveVideoInstanceConfig("test_video_1", "lang_es", {
  volume: 75,
  muted: false,
  manualTrackConfigured: true,
});
saveVideoInstanceConfig("test_video_1", "lang_he", {
  volume: 40,
  muted: true,
  manualTrackConfigured: false,
});

const instancesAfterSave = computeVideoInstances(["es", "he"], languagesCatalog, "test_video_1");
const esInstance = instancesAfterSave.find((i) => i.id === "lang_es");
const heInstance = instancesAfterSave.find((i) => i.id === "lang_he");
const primaryInstance = instancesAfterSave.find((i) => i.id === "primary");

assert.strictEqual(esInstance?.volume, 75);
assert.strictEqual(esInstance?.muted, false);
assert.strictEqual(esInstance?.manualTrackConfigured, true);

assert.strictEqual(heInstance?.volume, 40);
assert.strictEqual(heInstance?.muted, true);
assert.strictEqual(heInstance?.manualTrackConfigured, false);

assert.strictEqual(primaryInstance?.volume, 100);
assert.strictEqual(primaryInstance?.muted, false);
console.log("✅ PASS: Each video element remembers its own setup independently");

// Test 3: MultiVideoPlayerRegistry management and pause/mute coordination
console.log("Test 3: MultiVideoPlayerRegistry coordination...");
const registry = new MultiVideoPlayerRegistry();

let primaryPlaying = false;
let esPlaying = false;
let hePlaying = false;

let primaryMuted = false;
let esMuted = false;
let heMuted = false;

let esSeekTime = 0;
let heSeekTime = 0;

const mockPrimaryPlayer: YTPlayerLike = {
  playVideo: () => {
    primaryPlaying = true;
  },
  pauseVideo: () => {
    primaryPlaying = false;
  },
  seekTo: () => {},
  getCurrentTime: () => 12.5,
  mute: () => {
    primaryMuted = true;
  },
  unMute: () => {
    primaryMuted = false;
  },
};

const mockEsPlayer: YTPlayerLike = {
  playVideo: () => {
    esPlaying = true;
  },
  pauseVideo: () => {
    esPlaying = false;
  },
  seekTo: (sec) => {
    esSeekTime = sec;
  },
  getCurrentTime: () => 12.5,
  mute: () => {
    esMuted = true;
  },
  unMute: () => {
    esMuted = false;
  },
};

const mockHePlayer: YTPlayerLike = {
  playVideo: () => {
    hePlaying = true;
  },
  pauseVideo: () => {
    hePlaying = false;
  },
  seekTo: (sec) => {
    heSeekTime = sec;
  },
  getCurrentTime: () => 12.5,
  mute: () => {
    heMuted = true;
  },
  unMute: () => {
    heMuted = false;
  },
};

registry.register("primary", mockPrimaryPlayer);
registry.register("lang_es", mockEsPlayer);
registry.register("lang_he", mockHePlayer);

assert.strictEqual(registry.getRegisteredIds().length, 3);

// Simulate switching to Spanish player: pause all except lang_es, unmute only lang_es
primaryPlaying = true;
hePlaying = true;
esPlaying = true;

registry.pauseAllExcept("lang_es");
assert.strictEqual(primaryPlaying, false, "Primary should be paused");
assert.strictEqual(hePlaying, false, "Hebrew should be paused");
assert.strictEqual(esPlaying, true, "Spanish should remain playing");

registry.unmuteOnly("lang_es");
assert.strictEqual(esMuted, false, "Spanish should be unmuted");
assert.strictEqual(primaryMuted, true, "Primary should be muted");
assert.strictEqual(heMuted, true, "Hebrew should be muted");

// Sync secondary players to timestamp
registry.syncSecondaryPlayers(45.2, "primary");
assert.strictEqual(esSeekTime, 45.2, "Spanish player should seek to 45.2s");
assert.strictEqual(heSeekTime, 45.2, "Hebrew player should seek to 45.2s");

// Unregister test
registry.unregister("lang_he");
assert.strictEqual(registry.get("lang_he"), undefined);
assert.strictEqual(registry.getRegisteredIds().length, 2);

console.log("✅ PASS: MultiVideoPlayerRegistry manages independent players and coordination");

console.log("====================================================");
console.log("🎉 Subtask 49.1 Multi-Instance Video Player State tests PASSED!");
console.log("====================================================");
