import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  getCachedSubtitles,
  hasCachedSubtitles,
  saveCachedSubtitles,
  saveCachedTargetSubtitles,
  clearSubtitleCache,
} from "../src/utils/subtitleCache";
import { STORAGE_KEYS } from "../src/config/appConfig";

console.log("====================================================");
console.log("🧪 Starting No Subtitle Caching Verification Test");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Mock window and localStorage environment
const mockStorage: Record<string, string> = {};
(global as any).window = {
  localStorage: {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    key: (index: number) => Object.keys(mockStorage)[index] ?? null,
    get length() {
      return Object.keys(mockStorage).length;
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
  },
};
(global as any).localStorage = (global as any).window.localStorage;

// 2. Assert getCachedSubtitles returns null (caching disabled)
const testVideoId = "dQw4w9WgXcQ";
assert.strictEqual(
  getCachedSubtitles(testVideoId),
  null,
  "getCachedSubtitles must return null to enforce fresh subtitle retrieval",
);
assert.strictEqual(
  hasCachedSubtitles(testVideoId),
  false,
  "hasCachedSubtitles must return false",
);
console.log("✅ PASS: getCachedSubtitles and hasCachedSubtitles reflect disabled caching state");

// 3. Assert saveCachedSubtitles is a no-op and does NOT write to localStorage
const sampleCues = [
  { id: "1", start: 0, duration: 2, text: "Sample subtitle cue" },
];
saveCachedSubtitles(testVideoId, sampleCues);
const cacheKey = `${STORAGE_KEYS.SUBTITLE_CACHE_PREFIX}${testVideoId}`;
assert.strictEqual(
  mockStorage[cacheKey],
  undefined,
  `saveCachedSubtitles must NOT write to localStorage key ${cacheKey}`,
);

saveCachedTargetSubtitles(testVideoId, "he", sampleCues);
const targetCacheKey = `${STORAGE_KEYS.SUBTITLE_CACHE_PREFIX}${testVideoId}_he`;
assert.strictEqual(
  mockStorage[targetCacheKey],
  undefined,
  `saveCachedTargetSubtitles must NOT write to localStorage key ${targetCacheKey}`,
);
console.log("✅ PASS: saveCachedSubtitles and saveCachedTargetSubtitles do not write to localStorage");

// 4. Assert clearSubtitleCache purges any legacy yt_subtitles_* keys
mockStorage[`yt_subtitles_legacy_1`] = JSON.stringify({ old: true });
mockStorage[`yt_subtitles_legacy_2`] = JSON.stringify({ old: true });
mockStorage[`unrelated_key`] = "keep_me";

clearSubtitleCache();

assert.strictEqual(mockStorage[`yt_subtitles_legacy_1`], undefined, "Legacy key 1 must be removed");
assert.strictEqual(mockStorage[`yt_subtitles_legacy_2`], undefined, "Legacy key 2 must be removed");
assert.strictEqual(mockStorage[`unrelated_key`], "keep_me", "Unrelated localStorage keys must remain untouched");
console.log("✅ PASS: clearSubtitleCache purges legacy yt_subtitles_* keys cleanly");

// 5. Assert src/routes/index.tsx guarantees fresh tracks by resetting tracks on video/target change
const indexPath = path.join(rootDir, "src", "routes", "index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf8");

assert(
  !indexContent.includes("saveCachedSubtitles"),
  "src/routes/index.tsx must NOT import or call saveCachedSubtitles",
);
assert(
  !indexContent.includes("saveCachedTargetSubtitles"),
  "src/routes/index.tsx must NOT import or call saveCachedTargetSubtitles",
);
assert(
  !indexContent.includes("getCachedSubtitles"),
  "src/routes/index.tsx must NOT import or call getCachedSubtitles",
);
assert(
  indexContent.includes("setTracks(null)"),
  "src/routes/index.tsx must reset tracks on video change to guarantee fresh fetching",
);
console.log("✅ PASS: src/routes/index.tsx is free of subtitle caching and enforces fresh retrieval");

console.log("====================================================");
console.log("🎉 All No Subtitle Caching tests PASSED successfully!");
console.log("====================================================");
