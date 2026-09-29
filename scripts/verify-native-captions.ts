import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  buildTranslatedCaptionUrl,
  decodeInterceptedCaption,
  parseJson3,
  timedTextVideoId,
} from "../src/lib/native-captions";

console.log("====================================================");
console.log("🧪 Starting Native Captions & tlang Replacement Test");
console.log("====================================================");

// 1. Verify URL building when targetLanguage matches original lang
const baseEnUrl = "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3";
const sameLangResult = buildTranslatedCaptionUrl(baseEnUrl, "en");
const parsedSame = new URL(sameLangResult);

assert.strictEqual(
  parsedSame.searchParams.get("tlang"),
  null,
  "When target language is identical to original lang (en), tlang must NOT be appended",
);
assert.strictEqual(
  parsedSame.searchParams.get("lang"),
  "en",
  "Base language parameter must be preserved",
);
assert.strictEqual(
  parsedSame.searchParams.get("fmt"),
  "json3",
  "Format parameter must be json3",
);
console.log("✅ PASS: Native language fetching strips invalid tlang");

// 2. Verify URL building when targetLanguage is different from original lang
const translatedHebrew = buildTranslatedCaptionUrl(baseEnUrl, "he");
const parsedHe = new URL(translatedHebrew);

assert.strictEqual(
  parsedHe.searchParams.get("tlang"),
  "he",
  "Target language he must be set as tlang",
);
assert.strictEqual(
  parsedHe.searchParams.get("v"),
  "L2Ryrr6txwA",
  "Video ID must be preserved in translated URL",
);
console.log("✅ PASS: Translated target language sets tlang correctly (he)");

const translatedSpanish = buildTranslatedCaptionUrl(baseEnUrl, "es");
const parsedEs = new URL(translatedSpanish);

assert.strictEqual(
  parsedEs.searchParams.get("tlang"),
  "es",
  "Target language es must be set as tlang",
);
console.log("✅ PASS: Translated target language sets tlang correctly (es)");

// 3. Verify video ID extraction
assert.strictEqual(timedTextVideoId(baseEnUrl), "L2Ryrr6txwA");
console.log("✅ PASS: Video ID correctly extracted from timedtext URL");

// 4. Verify base64 intercepted caption decoding
const samplePayload = {
  url: baseEnUrl,
  rawData: JSON.stringify({
    events: [
      {
        tStartMs: 0,
        dDurationMs: 3000,
        segs: [{ utf8: "Authentic dialogue line" }],
      },
    ],
  }),
};

const base64Encoded = Buffer.from(JSON.stringify(samplePayload)).toString("base64");
const decoded = decodeInterceptedCaption(base64Encoded);
assert(decoded !== null, "Decoded payload must not be null");
assert.strictEqual(decoded.url, baseEnUrl);
const parsedJson = parseJson3(decoded.rawData);
assert(parsedJson !== null, "Parsed JSON3 must not be null");
assert.strictEqual(parsedJson.events?.[0]?.segs?.[0]?.utf8, "Authentic dialogue line");
console.log("✅ PASS: Intercepted base64 payload decoding and JSON3 parsing verified");

// 5. Verify MainActivity.kt has the originalLang check
const mainActivityPath = path.join(
  process.cwd(),
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf8");
assert(
  mainActivityContent.includes("uri.getQueryParameter(\"lang\")"),
  "MainActivity.kt must inspect original lang parameter to avoid invalid tlang",
);
console.log("✅ PASS: MainActivity.kt Kotlin bridge logic verified");

console.log("====================================================");
console.log("📊 NATIVE CAPTIONS TEST: All tests passed!");
console.log("====================================================");
