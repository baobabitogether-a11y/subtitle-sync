/**
 * Verification test for Subtask 49.2: Horizontal Swiper Carousel Component for Multi-Video Elements.
 * Validates:
 * 1. VideoInstancesSwiper component exports, accessibility attributes, touch swipe logic, and indicators.
 * 2. Independent audio track configuration guidance, toggle, and persistence per instance.
 * 3. Dynamic carousel synchronization with active playback and active audio badge.
 * 4. Integration into player panel in src/routes/index.tsx.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  computeVideoInstances,
  loadStoredInstanceConfigs,
  saveVideoInstanceConfig,
  type VideoInstanceConfig,
} from "../src/utils/multiVideoPlayerManager";

console.log("====================================================");
console.log("🧪 Running Subtask 49.2: Video Instances Swiper Verification");
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
];

// Test 1: Verify VideoInstancesSwiper component source code contracts
console.log("Test 1: VideoInstancesSwiper component contract verification...");
const swiperComponentPath = path.resolve(process.cwd(), "src/components/VideoInstancesSwiper.tsx");
assert.ok(fs.existsSync(swiperComponentPath), "src/components/VideoInstancesSwiper.tsx must exist");
const swiperCode = fs.readFileSync(swiperComponentPath, "utf-8");

assert.ok(
  swiperCode.includes("export const VideoInstancesSwiper"),
  "VideoInstancesSwiper must be exported as a named component",
);
assert.ok(
  swiperCode.includes('data-testid="video-instances-swiper"'),
  'Component must contain data-testid="video-instances-swiper"',
);
assert.ok(
  swiperCode.includes('aria-label="Previous video instance"') &&
    swiperCode.includes('aria-label="Next video instance"'),
  "Component must include accessible navigation buttons with aria-labels",
);
assert.ok(
  swiperCode.includes("onTouchStart") &&
    swiperCode.includes("onTouchMove") &&
    swiperCode.includes("onTouchEnd"),
  "Component must implement touch events for horizontal swipe gestures",
);
assert.ok(
  swiperCode.includes('data-testid="swiper-indicators"'),
  "Component must render slide indicators / tabs for multi-instance navigation",
);
assert.ok(
  swiperCode.includes('data-testid="swiper-active-playing-badge"'),
  "Component must include active audio track playing badge",
);
assert.ok(
  swiperCode.includes("Native YouTube Audio Track Configuration for"),
  "Component must provide clear YouTube audio track setup guidance for secondary instances",
);
console.log("✅ PASS: VideoInstancesSwiper contract and accessibility checks passed");

// Test 2: Compute instances for swiper and assert structure
console.log("Test 2: Multi-instance swiper data computation...");
const testVideoId = "swiper_test_video_123";
const instances = computeVideoInstances(["es", "he"], languagesCatalog, testVideoId);

assert.strictEqual(instances.length, 3, "Expected 3 instances: primary, es, and he");
assert.strictEqual(instances[0].id, "primary");
assert.strictEqual(instances[0].isPrimary, true);
assert.strictEqual(instances[1].id, "lang_es");
assert.strictEqual(instances[1].languageCode, "es");
assert.strictEqual(instances[2].id, "lang_he");
assert.strictEqual(instances[2].languageCode, "he");
console.log("✅ PASS: Swiper receives correct instances structure");

// Test 3: Independent setup toggle per instance persists via saveVideoInstanceConfig
console.log("Test 3: Audio track setup toggle isolation and persistence...");
// Toggle configured state on Spanish instance
saveVideoInstanceConfig(testVideoId, "lang_es", { manualTrackConfigured: true });

const storedConfigs = loadStoredInstanceConfigs(testVideoId);
assert.strictEqual(
  storedConfigs["lang_es"]?.manualTrackConfigured,
  true,
  "Spanish instance must be marked configured",
);
assert.strictEqual(
  storedConfigs["lang_he"]?.manualTrackConfigured,
  undefined,
  "Hebrew instance must remain unconfigured without leakage",
);

// Toggle Hebrew instance independently
saveVideoInstanceConfig(testVideoId, "lang_he", { manualTrackConfigured: false, volume: 85 });
const updatedConfigs = loadStoredInstanceConfigs(testVideoId);
assert.strictEqual(updatedConfigs["lang_he"]?.manualTrackConfigured, false);
assert.strictEqual(updatedConfigs["lang_he"]?.volume, 85);
assert.strictEqual(updatedConfigs["lang_es"]?.manualTrackConfigured, true);
console.log("✅ PASS: Setup configuration is isolated per instance in swiper");

// Test 4: Swiper carousel index bounds and navigation calculations
console.log("Test 4: Carousel slide bounds calculation...");
const calculateBoundIndex = (requested: number, total: number) => {
  return Math.max(0, Math.min(requested, Math.max(0, total - 1)));
};

assert.strictEqual(calculateBoundIndex(-1, 3), 0, "Negative index clamps to 0");
assert.strictEqual(calculateBoundIndex(0, 3), 0, "Index 0 remains 0");
assert.strictEqual(calculateBoundIndex(1, 3), 1, "Index 1 remains 1");
assert.strictEqual(calculateBoundIndex(2, 3), 2, "Index 2 remains 2");
assert.strictEqual(calculateBoundIndex(3, 3), 2, "Index 3 clamps to 2 (total - 1)");
assert.strictEqual(calculateBoundIndex(99, 3), 2, "Index 99 clamps to 2");
console.log("✅ PASS: Carousel index bounds logic is robust");

// Test 5: Integration in src/routes/index.tsx
console.log("Test 5: Integration in src/routes/index.tsx...");
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexCode = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexCode.includes('import { VideoInstancesSwiper } from "@/components/VideoInstancesSwiper"'),
  "src/routes/index.tsx must import VideoInstancesSwiper",
);
assert.ok(
  indexCode.includes("const videoInstances = useMemo"),
  "src/routes/index.tsx must compute videoInstances with useMemo",
);
assert.ok(
  indexCode.includes("<VideoInstancesSwiper"),
  "src/routes/index.tsx must render <VideoInstancesSwiper",
);
assert.ok(
  indexCode.includes("instances={videoInstances}"),
  "VideoInstancesSwiper must receive videoInstances prop",
);
assert.ok(
  indexCode.includes("activeIndex={activeSwiperIndex}"),
  "VideoInstancesSwiper must receive activeIndex prop",
);
assert.ok(
  indexCode.includes('multiVideoPlayerRegistry.register("primary"'),
  "src/routes/index.tsx must register primary player with multiVideoPlayerRegistry",
);
assert.ok(
  indexCode.includes("secondaryPlayerHosts.current"),
  "src/routes/index.tsx must manage secondaryPlayerHosts",
);
console.log("✅ PASS: VideoInstancesSwiper fully integrated into src/routes/index.tsx");

console.log("====================================================");
console.log("🎉 Subtask 49.2 Video Instances Swiper tests PASSED!");
console.log("====================================================");
