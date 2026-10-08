/**
 * Verification test for Speech Synthesis Voice deduplication and unique React keys.
 * Validates that duplicate browser voices (such as Microsoft Asaf - Hebrew (Israel))
 * are properly deduplicated and produce guaranteed unique React keys without collisions.
 */

import assert from "node:assert";
import {
  deduplicateVoices,
  getLanguageVoices,
  getUniqueVoiceKey,
  type SpeechVoiceLike,
} from "../src/utils/speechVoiceUtils";

console.log("====================================================");
console.log("🧪 Running Speech Synthesis Voice Key & Deduplication Tests");
console.log("====================================================");

// Mock voices simulating Windows/Chromium voice enumeration where duplicate
// "Microsoft Asaf - Hebrew (Israel)" voices are returned by speechSynthesis.getVoices()
const mockVoicesWithDuplicates: SpeechVoiceLike[] = [
  {
    voiceURI: "Microsoft Asaf - Hebrew (Israel)",
    name: "Microsoft Asaf - Hebrew (Israel)",
    lang: "he-IL",
    localService: true,
  },
  {
    voiceURI: "Microsoft Asaf - Hebrew (Israel)",
    name: "Microsoft Asaf - Hebrew (Israel)",
    lang: "he-IL",
    localService: false,
  },
  {
    voiceURI: "Microsoft Hila - Hebrew (Israel)",
    name: "Microsoft Hila - Hebrew (Israel)",
    lang: "he-IL",
  },
  {
    voiceURI: "Google español",
    name: "Google español",
    lang: "es-ES",
  },
  {
    voiceURI: "Google US English",
    name: "Google US English",
    lang: "en-US",
  },
  {
    voiceURI: "Google US English",
    name: "Google US English",
    lang: "en-US",
  },
];

// Test 1: Deduplication removes duplicate voices with the same voiceURI
console.log("Test 1: Deduplication removes duplicate voices with identical voiceURI...");
const deduplicated = deduplicateVoices(mockVoicesWithDuplicates);
assert.strictEqual(
  deduplicated.length,
  4,
  `Expected 4 unique voices after deduplication, got ${deduplicated.length}`,
);
const asafCount = deduplicated.filter(
  (v) => v.voiceURI === "Microsoft Asaf - Hebrew (Israel)",
).length;
assert.strictEqual(
  asafCount,
  1,
  `Expected exactly 1 instance of 'Microsoft Asaf - Hebrew (Israel)', got ${asafCount}`,
);
console.log("✅ PASS: Deduplication successfully removed duplicate Microsoft Asaf voice");

// Test 2: getLanguageVoices filters and deduplicates for a specific language (e.g. 'he')
console.log("Test 2: getLanguageVoices filters and deduplicates Hebrew voices...");
const hebrewVoices = getLanguageVoices(mockVoicesWithDuplicates, "he");
assert.strictEqual(
  hebrewVoices.length,
  2,
  `Expected 2 Hebrew voices (Asaf and Hila), got ${hebrewVoices.length}`,
);
assert.strictEqual(hebrewVoices[0].name, "Microsoft Asaf - Hebrew (Israel)");
assert.strictEqual(hebrewVoices[1].name, "Microsoft Hila - Hebrew (Israel)");
console.log("✅ PASS: getLanguageVoices returned unique Hebrew voices");

// Test 3: getUniqueVoiceKey produces unique React keys across items
console.log("Test 3: getUniqueVoiceKey produces strictly unique keys...");
const keys = hebrewVoices.map((voice, idx) => getUniqueVoiceKey(voice, idx));
const uniqueKeys = new Set(keys);
assert.strictEqual(
  uniqueKeys.size,
  keys.length,
  `Keys must be unique! Found ${uniqueKeys.size} unique keys out of ${keys.length}`,
);
assert(
  !keys.includes("Microsoft Asaf - Hebrew (Israel)"),
  "Keys should include index suffix to prevent raw collision with text",
);
console.log("✅ PASS: Generated React keys are unique:", keys);

// Test 4: Edge case where multiple voices have identical properties and empty voiceURI
console.log("Test 4: Handling voices without voiceURI or identical names...");
const anonymousVoices: SpeechVoiceLike[] = [
  { voiceURI: "", name: "Default Voice", lang: "en-US" },
  { voiceURI: "", name: "Default Voice", lang: "en-US" },
  { voiceURI: "", name: "Secondary Voice", lang: "en-US" },
];
const dedupedAnon = deduplicateVoices(anonymousVoices);
assert.strictEqual(
  dedupedAnon.length,
  2,
  `Expected 2 voices after deduplicating name/lang fallback, got ${dedupedAnon.length}`,
);
const anonKeys = dedupedAnon.map((voice, idx) => getUniqueVoiceKey(voice, idx));
assert.strictEqual(new Set(anonKeys).size, anonKeys.length, "All anon voice keys must be unique");
console.log("✅ PASS: Fallback deduplication and unique keys work correctly");

// Test 5: Verify index.tsx uses getLanguageVoices and getUniqueVoiceKey
console.log("Test 5: Verify src/routes/index.tsx integrates speechVoiceUtils...");
import fs from "node:fs";
const indexSource = fs.readFileSync("src/routes/index.tsx", "utf-8");
assert(
  indexSource.includes("getLanguageVoices(voices, lang.tts)"),
  "src/routes/index.tsx must use getLanguageVoices to obtain voices",
);
assert(
  indexSource.includes("getUniqueVoiceKey(voice, voiceIndex)"),
  "src/routes/index.tsx must use getUniqueVoiceKey for option keys",
);
assert(
  indexSource.includes("deduplicateVoices("),
  "src/routes/index.tsx must deduplicate voices when setting voices state",
);
console.log("✅ PASS: src/routes/index.tsx properly integrates speechVoiceUtils");

console.log("====================================================");
console.log("🎉 ALL Speech Voice Unique Keys verification tests PASSED!");
console.log("====================================================");
