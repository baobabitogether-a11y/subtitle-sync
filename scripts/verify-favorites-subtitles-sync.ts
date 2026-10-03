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

// 2. No automatic retries: no retry counters, no backoff timers, single attempt per URL+language
assert(!indexContent.includes("retriesRef"), "index.tsx must not keep retry counters");
assert(!indexContent.includes("Math.pow(2"), "index.tsx must not schedule backoff retries");
assert(
  indexContent.includes("attemptedRef.current.has(`${activeUrl}|${code}`)"),
  "fetch must be attempted once per observed URL and language",
);
console.log("✅ PASS: No automatic fetch retries");

// 3. Manual fetch on failure
assert(indexContent.includes('data-testid="subtitles-manual-fetch"'), "manual Fetch again button must exist");
assert(
  indexContent.includes("attemptedRef.current.delete(`${url}|${code}`)"),
  "manual fetch must clear the attempt marker before re-fetching",
);
console.log("✅ PASS: Manual fetch for failed languages");

// 4. Functional simulation: failed fetch stays failed until manual action
const attempted = new Set<string>();
const failedLangs: string[] = [];
let calls = 0;
function fetchOnce(url: string, lang: string, ok: boolean) {
  const key = `${url}|${lang}`;
  if (attempted.has(key)) return;
  attempted.add(key);
  calls++;
  if (!ok) failedLangs.push(lang);
}
fetchOnce("u", "he", false);
fetchOnce("u", "he", false); // effect re-run: must not refetch
assert.strictEqual(calls, 1, "no automatic second attempt");
attempted.delete("u|he");
fetchOnce("u", "he", true); // manual
assert.strictEqual(calls, 2, "manual fetch triggers exactly one new attempt");
console.log("✅ PASS: Single-attempt + manual fetch simulation");

console.log("====================================================");
console.log("🎉 All Favorites & Subtitles Sync tests PASSED successfully!");
console.log("====================================================");
