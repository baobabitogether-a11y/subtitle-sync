import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  buildLangReplacedCaptionUrl,
  buildTranslatedCaptionUrl,
  parseJson3,
} from "../src/lib/native-captions";
import {
  subtitleRequestModeOrder,
  type SubtitleRequestMode,
} from "../src/lib/playback-preferences";
import { isValidJsonSubtitleResponse } from "../src/utils/subtitleCache";

console.log("====================================================");
console.log("🧪 Starting Subtitle API Auto-Fallback Verification");
console.log("   (Auto fallback on invalid response between tlang & lang)");
console.log("====================================================");

const rootDir = process.cwd();

// ============================================================================
// 1. Verify URL Construction and Preference Fallback Order
// ============================================================================
console.log("\n--- [1] Testing URL Construction & Mode Order ---");

const baseUrl = "https://www.youtube.com/api/timedtext?v=n9qwEOsqsoo&lang=en&fmt=srv3";

// Option A: tlang addition
const tlangUrl = buildTranslatedCaptionUrl(baseUrl, "he", "json3");
const parsedTlang = new URL(tlangUrl);
assert.strictEqual(
  parsedTlang.searchParams.get("lang"),
  "en",
  "tlang URL must retain original lang",
);
assert.strictEqual(parsedTlang.searchParams.get("tlang"), "he", "tlang URL must contain tlang");
assert.strictEqual(
  parsedTlang.searchParams.get("fmt"),
  "json3",
  "tlang URL must specify fmt=json3",
);
console.log("✅ PASS: buildTranslatedCaptionUrl correctly creates tlang option");

// Option B: lang replacement
const langUrl = buildLangReplacedCaptionUrl(baseUrl, "he", "json3");
const parsedLang = new URL(langUrl);
assert.strictEqual(
  parsedLang.searchParams.get("lang"),
  "he",
  "lang URL must replace lang with target language",
);
assert.strictEqual(
  parsedLang.searchParams.get("tlang"),
  null,
  "lang URL must NOT contain tlang parameter",
);
assert.strictEqual(parsedLang.searchParams.get("fmt"), "json3", "lang URL must specify fmt=json3");
console.log("✅ PASS: buildLangReplacedCaptionUrl correctly creates lang option");

// Fallback order contracts
assert.deepStrictEqual(
  subtitleRequestModeOrder("tlang"),
  ["tlang", "lang"],
  "When primary is tlang, fallback must be lang",
);
assert.deepStrictEqual(
  subtitleRequestModeOrder("lang"),
  ["lang", "tlang"],
  "When primary is lang, fallback must be tlang",
);
console.log("✅ PASS: subtitleRequestModeOrder provides reciprocal 2-tier fallback order");

// ============================================================================
// 2. Functional Simulation of Auto-Fallback on Invalid Response
// ============================================================================
console.log("\n--- [2] Simulating Auto-Fallback Execution Across Scenarios ---");

const validPayload = JSON.stringify({
  wireMagic: "pb3",
  events: [
    {
      tStartMs: 500,
      dDurationMs: 1500,
      segs: [{ utf8: "שלום עולם" }],
    },
  ],
});
const invalidHtmlPayload = "<html><body>404 Not Found</body></html>";
const emptyPayload = "";

function simulateSubtitleFetchWithFallback(
  primaryMode: SubtitleRequestMode,
  mockNetworkResponder: (mode: SubtitleRequestMode) => string,
): { success: boolean; loadedJson: any | null; attempts: SubtitleRequestMode[] } {
  const modes = subtitleRequestModeOrder(primaryMode);
  const attempts: SubtitleRequestMode[] = [];
  let json: any = null;

  for (const mode of modes) {
    attempts.push(mode);
    const raw = mockNetworkResponder(mode);
    if (raw && isValidJsonSubtitleResponse(raw)) {
      json = parseJson3(raw);
      if (json) break;
    }
  }

  return {
    success: json !== null,
    loadedJson: json,
    attempts,
  };
}

// Scenario A: Primary mode "tlang" fails with invalid HTML -> auto fallbacks to "lang" which succeeds
const runA = simulateSubtitleFetchWithFallback("tlang", (mode) => {
  if (mode === "tlang") return invalidHtmlPayload;
  return validPayload;
});
assert.strictEqual(runA.success, true, "Scenario A must succeed via fallback");
assert.deepStrictEqual(
  runA.attempts,
  ["tlang", "lang"],
  "Scenario A must have attempted tlang then lang",
);
assert(runA.loadedJson !== null, "Scenario A must yield parsed JSON");
console.log(
  "✅ PASS: Scenario A: tlang returns invalid response -> auto fallback to lang succeeds",
);

// Scenario B: Primary mode "lang" fails with empty response -> auto fallbacks to "tlang" which succeeds
const runB = simulateSubtitleFetchWithFallback("lang", (mode) => {
  if (mode === "lang") return emptyPayload;
  return validPayload;
});
assert.strictEqual(runB.success, true, "Scenario B must succeed via fallback");
assert.deepStrictEqual(
  runB.attempts,
  ["lang", "tlang"],
  "Scenario B must have attempted lang then tlang",
);
assert(runB.loadedJson !== null, "Scenario B must yield parsed JSON");
console.log("✅ PASS: Scenario B: lang returns empty response -> auto fallback to tlang succeeds");

// Scenario C: Primary mode succeeds on first try -> does NOT attempt fallback
const runC = simulateSubtitleFetchWithFallback("tlang", (_mode) => {
  return validPayload;
});
assert.strictEqual(runC.success, true, "Scenario C must succeed immediately");
assert.deepStrictEqual(
  runC.attempts,
  ["tlang"],
  "Scenario C must only execute single attempt when successful",
);
console.log("✅ PASS: Scenario C: first option succeeds -> zero unnecessary fallback requests");

// Scenario D: Both options return invalid responses -> fails cleanly without crashing or caching
const runD = simulateSubtitleFetchWithFallback("tlang", (_mode) => {
  return "Error: no captions";
});
assert.strictEqual(
  runD.success,
  false,
  "Scenario D must fail when both options return invalid responses",
);
assert.deepStrictEqual(
  runD.attempts,
  ["tlang", "lang"],
  "Scenario D must have exhausted both options",
);
assert.strictEqual(runD.loadedJson, null, "Scenario D must yield null json");
console.log(
  "✅ PASS: Scenario D: both options return invalid responses -> cleanly handled as failure",
);

// ============================================================================
// 3. Verify Android Shell (MainActivity.kt) Native Auto-Fallback Implementation
// ============================================================================
console.log("\n--- [3] Verifying Android Native Shell Auto-Fallback Contracts ---");

const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf8");

assert(
  mainActivityContent.includes("buildRepetitionUrl(mode: String)"),
  "MainActivity.kt must define buildRepetitionUrl helper for mode generation",
);
console.log("✅ PASS: MainActivity.kt defines buildRepetitionUrl helper");

assert(
  mainActivityContent.includes('listOf("lang", "tlang")') &&
    mainActivityContent.includes('listOf("tlang", "lang")'),
  "MainActivity.kt must support reciprocal modes order (lang/tlang and tlang/lang)",
);
console.log("✅ PASS: MainActivity.kt defines reciprocal fallback modes");

assert(
  mainActivityContent.includes("for (mode in modes)") &&
    mainActivityContent.includes("isValidJsonSubtitle(bodyString)"),
  "MainActivity.kt must iterate modes and check isValidJsonSubtitle",
);
console.log("✅ PASS: MainActivity.kt iterates options and validates JSON validity");

assert(
  mainActivityContent.includes("Falling back to alternative option"),
  "MainActivity.kt must log fallback transition when response is invalid or fails",
);
console.log("✅ PASS: MainActivity.kt logs auto-fallback when response is invalid");

// ============================================================================
// 4. Verify React Route (index.tsx) Implementation
// ============================================================================
console.log("\n--- [4] Verifying React Route (index.tsx) Auto-Fallback Contracts ---");

const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

assert(
  indexContent.includes("subtitleRequestModeOrder(requestModeRef.current)"),
  "src/routes/index.tsx must iterate through subtitleRequestModeOrder",
);
assert(
  indexContent.includes("isValidJsonSubtitleResponse(raw)"),
  "src/routes/index.tsx must verify isValidJsonSubtitleResponse before accepting track in mode loop",
);
console.log("✅ PASS: src/routes/index.tsx iterates request modes and enforces valid JSON");

console.log("\n====================================================");
console.log("🎉 ALL SUBTITLE API AUTO-FALLBACK CHECKS PASSED!");
console.log("====================================================");
