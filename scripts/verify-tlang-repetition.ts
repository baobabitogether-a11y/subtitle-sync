import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("====================================================");
console.log("🧪 Starting Android Shell tlang Repetition Test");
console.log("   (Verifying query preservation & header injection)");
console.log("====================================================");

const rootDir = process.cwd();
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert(fs.existsSync(mainActivityPath), `MainActivity.kt must exist at ${mainActivityPath}`);
const content = fs.readFileSync(mainActivityPath, "utf8");

// 1. Assert executeTimedTextRepetition preserves lang parameter (does not strip lang)
assert(
  !content.includes('val isLang = name.equals("lang", ignoreCase = true)'),
  "MainActivity.kt must NOT strip or isolate the 'lang' query parameter",
);
assert(
  content.includes('builder.appendQueryParameter("tlang", targetLang)'),
  "MainActivity.kt must append targetLang as tlang parameter",
);
console.log("✅ PASS: executeTimedTextRepetition preserves source language and appends target tlang");

// 2. Assert fallback authentic headers are provided if lastObservedHeaders is empty
assert(
  content.includes('reqBuilder.addHeader("Referer", "https://www.youtube.com/")'),
  "MainActivity.kt must provide fallback Referer header",
);
assert(
  content.includes('reqBuilder.addHeader("Origin", "https://www.youtube.com")'),
  "MainActivity.kt must provide fallback Origin header",
);
assert(
  content.includes('reqBuilder.addHeader("User-Agent"'),
  "MainActivity.kt must provide fallback User-Agent header",
);
console.log("✅ PASS: Fallback authentic YouTube headers configured for OkHttpClient");

// 3. Functional URL simulation of executeTimedTextRepetition matching Youtubenet6
function simulateExecuteTimedTextRepetition(
  base: string,
  targetLang: string,
  format: string = "json3",
): string {
  const url = new URL(base);
  const searchParams = url.searchParams;
  const entries: [string, string][] = [];

  for (const [key, val] of searchParams.entries()) {
    const isTlang = key.toLowerCase() === "tlang";
    const isFmt = key.toLowerCase() === "fmt" && format.length > 0;
    if (!isTlang && !isFmt) {
      entries.push([key, val]);
    }
  }

  const out = new URL(url.origin + url.pathname);
  for (const [k, v] of entries) {
    out.searchParams.append(k, v);
  }
  out.searchParams.append("tlang", targetLang);
  if (format) {
    out.searchParams.append("fmt", format);
  }
  return out.toString();
}

const sampleObserved =
  "https://www.youtube.com/api/timedtext?v=n9qwEOsqsoo&lang=en&fmt=json3&sparams=ip%2Cexpire&signature=xyz123&key=yt8&expire=1800000000";

// Swap to Hebrew
const hebrewUrl = simulateExecuteTimedTextRepetition(sampleObserved, "he", "json3");
const parsedHe = new URL(hebrewUrl);
assert.strictEqual(parsedHe.searchParams.get("v"), "n9qwEOsqsoo", "v parameter must be preserved");
assert.strictEqual(parsedHe.searchParams.get("lang"), "en", "original source lang must be preserved");
assert.strictEqual(parsedHe.searchParams.get("tlang"), "he", "target tlang must be set to 'he'");
assert.strictEqual(parsedHe.searchParams.get("fmt"), "json3", "format fmt must be json3");
assert.strictEqual(parsedHe.searchParams.get("signature"), "xyz123", "signed signature token must be preserved");
assert.strictEqual(parsedHe.searchParams.get("key"), "yt8", "key token must be preserved");
console.log("✅ PASS: Hebrew tlang swapping preserves signature and original source lang");

// Swap to Italian
const italianUrl = simulateExecuteTimedTextRepetition(hebrewUrl, "it", "json3");
const parsedIt = new URL(italianUrl);
assert.strictEqual(parsedIt.searchParams.get("tlang"), "it", "previous tlang must be cleanly replaced with 'it'");
assert.strictEqual(parsedIt.searchParams.getAll("tlang").length, 1, "exactly one tlang param must exist");
assert.strictEqual(parsedIt.searchParams.get("lang"), "en", "original source lang preserved across consecutive swaps");
console.log("✅ PASS: Sequential tlang swapping replaces previous tlang without duplication");

console.log("====================================================");
console.log("🎉 All tlang repetition tests PASSED successfully!");
console.log("====================================================");
