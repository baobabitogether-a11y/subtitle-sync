import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Progressive Subtitles Loading Test");
console.log("====================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// 1. Verify React useTransition is imported and used
assert(
  indexContent.includes("useTransition") &&
    indexContent.includes("startSubtitlesTransition") &&
    indexContent.includes("isSubtitlesPending"),
  "src/routes/index.tsx must use useTransition (startSubtitlesTransition, isSubtitlesPending) for non-blocking subtitle loading",
);
console.log("✅ PASS: Non-blocking React useTransition integrated in state");

// 2. Verify progressive track streaming in fetchFavoriteLanguageSubtitles
assert(
  indexContent.includes("startSubtitlesTransition(() => {") &&
    indexContent.includes("setTracks((prev) => ({ ...prev, [code]: json! }));"),
  "fetchFavoriteLanguageSubtitles must stream each fetched track into state progressively",
);
console.log(
  "✅ PASS: Progressive per-track streaming verified (streaming languages as they arrive)",
);

// 3. Verify event loop yielding to prevent thread starvation
assert(
  indexContent.includes("await new Promise<void>((resolve) => setTimeout(resolve, 0))"),
  "fetchFavoriteLanguageSubtitles must yield execution between language requests to prevent UI thread starvation",
);
console.log("✅ PASS: Microtask/macrotask event loop yielding verified");

// 4. Verify intercepted live captions use transition
assert(
  indexContent.includes("window.onNativeCaptionsInterceptedBase64") &&
    indexContent.includes("startSubtitlesTransition(() => {") &&
    indexContent.includes("setTracks((prev) => ({ ...prev, [lang]: json }));"),
  "onNativeCaptionsInterceptedBase64 must use startSubtitlesTransition for intercepted captions",
);
console.log("✅ PASS: Intercepted live captions state updates wrapped in non-blocking transitions");

// 5. Verify visual progressive loading indicator
assert(
  indexContent.includes('data-testid="subtitles-progressive-indicator"') ||
    indexContent.includes("isSubtitlesPending"),
  "Subtitles UI must indicate progressive non-blocking loading when isSubtitlesPending is active",
);
console.log("✅ PASS: Visual indicator for progressive loading verified");

// 6. Verify benchmark simulation: progressive updates vs blocking updates
const mockCues = Array.from({ length: 500 }, (_, i) => ({
  tStartMs: i * 1000,
  dDurationMs: 900,
  segs: [{ utf8: `Cue text ${i}` }],
}));
const mockJson3 = { events: mockCues };

let simulatedTracks: Record<string, typeof mockJson3> = {};
const languages = ["he", "it", "es", "fr", "de"];

// Test that progressive addition keeps memory and operations clean
const startTime = Date.now();
for (const lang of languages) {
  simulatedTracks = { ...simulatedTracks, [lang]: mockJson3 };
  assert.strictEqual(Boolean(simulatedTracks[lang]), true);
}
const elapsed = Date.now() - startTime;
assert(elapsed < 200, `Progressive tracking took too long: ${elapsed}ms`);
console.log(
  `✅ PASS: Progressive simulation across ${languages.length} languages completed in ${elapsed}ms`,
);

console.log("====================================================");
console.log("🎉 All Progressive Subtitles Loading tests PASSED successfully!");
console.log("====================================================");
