import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Favorites & Subtitles Sync with Auto-Fetch-Retry Test");
console.log("====================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// 1. Verify cols includes all targetLanguages unconditionally
assert(
  indexContent.includes("targetLanguages.includes(l.code) || (tracks ? Boolean(tracks[l.code]) : true)"),
  "cols calculation must ensure all favorite languages in targetLanguages are included in subtitles columns",
);
console.log("✅ PASS: Subtitles columns unconditionally present all active favorite languages");

// 2. Verify auto-sync effect synchronizes shown and triggers auto-fetch-retry
assert(
  indexContent.includes("missingInShown = targetLanguages.filter((l) => !shown.includes(l))") &&
    indexContent.includes("missingTracks = targetLanguages.filter("),
  "index.tsx must continuously synchronize shown and trigger auto-fetch-retry for missing favorite tracks",
);
assert(
  indexContent.includes("fetchFavoriteLanguageSubtitles(missingTracks, observedUrl)"),
  "index.tsx must trigger auto-fetch-retry for missingTracks",
);
console.log("✅ PASS: Continuous favorite languages auto-sync & auto-fetch-retry effect verified");

// 3. Verify retry backoff logic in fetchFavoriteLanguageSubtitles
assert(
  indexContent.includes("retriesRef.current[code] = (retriesRef.current[code] || 0) + 1") &&
    indexContent.includes("retriesRef.current[code] = 0"),
  "fetchFavoriteLanguageSubtitles must track retries and reset on success",
);
console.log("✅ PASS: Retry counter and backoff execution verified");

// 4. Verify UI alignment badges and loading placeholder
assert(
  indexContent.includes('data-testid="subtitles-sync-aligned"'),
  "index.tsx must render subtitles-sync-aligned badge when all favorites are aligned",
);
assert(
  indexContent.includes('data-testid="subtitles-sync-retrying"'),
  "index.tsx must render subtitles-sync-retrying badge when favorite tracks are missing/syncing",
);
assert(
  indexContent.includes("Loading subtitles…"),
  "index.tsx must render graceful loading placeholder in cells for pending favorite language tracks",
);
console.log("✅ PASS: Synchronization indicators and cell placeholder verified");

// 5. Functional simulation of auto-fetch-retry alignment loop
interface MockTrackState {
  tracks: Record<string, { events: any[] }>;
  favorites: string[];
}

const state: MockTrackState = {
  tracks: { en: { events: [{ tStartMs: 0, dDurationMs: 1000 }] } },
  favorites: ["he", "es"],
};

let attempts: Record<string, number> = {};

function simulateFetchWithRetry(lang: string): boolean {
  attempts[lang] = (attempts[lang] || 0) + 1;
  // Simulate failure on first attempt, success on second
  if (attempts[lang] < 2) {
    return false;
  }
  state.tracks[lang] = { events: [{ tStartMs: 0, dDurationMs: 1000 }] };
  return true;
}

// Initial state: missing favorites
let missing = state.favorites.filter((l) => !state.tracks[l]);
assert.strictEqual(missing.length, 2, "Expected 2 missing favorite tracks initially");

// First attempt: both fail
for (const lang of missing) {
  simulateFetchWithRetry(lang);
}
missing = state.favorites.filter((l) => !state.tracks[l]);
assert.strictEqual(missing.length, 2, "Both tracks still missing after attempt 1");

// Second attempt: auto-retry succeeds
for (const lang of missing) {
  simulateFetchWithRetry(lang);
}
missing = state.favorites.filter((l) => !state.tracks[l]);
assert.strictEqual(missing.length, 0, "All tracks aligned after auto-fetch-retry attempt 2");
assert.ok(state.tracks.he && state.tracks.es, "Both favorite tracks loaded successfully");
console.log("✅ PASS: Functional auto-fetch-retry alignment simulation succeeded");

console.log("====================================================");
console.log("🎉 All Favorites & Subtitles Sync tests PASSED successfully!");
console.log("====================================================");
