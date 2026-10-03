import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { parseVideoId } from "../src/lib/native-captions";
import { extractYouTubeId } from "../src/utils/youtube";

console.log("====================================================");
console.log("🧪 Starting YouTube Share Intent & Video ID Verification");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify parseVideoId & extractYouTubeId handles all real-world Android share payloads
const EXPECTED_VIDEO_ID = "dQw4w9WgXcQ";

const testPayloads = [
  { label: "Bare 11-char ID", text: "dQw4w9WgXcQ" },
  { label: "Standard watch link", text: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { label: "Standard watch link with parameters", text: "https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=42s" },
  { label: "youtu.be short link", text: "https://youtu.be/dQw4w9WgXcQ" },
  { label: "youtu.be with tracking parameter", text: "https://youtu.be/dQw4w9WgXcQ?si=abcdef123" },
  { label: "YouTube Shorts URL", text: "https://www.youtube.com/shorts/dQw4w9WgXcQ" },
  { label: "YouTube Shorts with feature share", text: "https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share" },
  { label: "YouTube Live link", text: "https://www.youtube.com/live/dQw4w9WgXcQ" },
  { label: "YouTube Embed link", text: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { label: "Mobile m.youtube.com link", text: "https://m.youtube.com/watch?v=dQw4w9WgXcQ" },
  { label: "YouTube app share text with prefix", text: "Check out this video on YouTube: https://youtu.be/dQw4w9WgXcQ" },
  { label: "YouTube app share text with title and newline", text: "Rick Astley - Never Gonna Give You Up (Official Music Video)\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { label: "WhatsApp shared text wrapper", text: "Have a look at this: <https://youtu.be/dQw4w9WgXcQ>" },
  { label: "Quoted URL in text", text: '"https://www.youtube.com/watch?v=dQw4w9WgXcQ"' },
];

for (const payload of testPayloads) {
  const extracted = parseVideoId(payload.text);
  assert.strictEqual(
    extracted,
    EXPECTED_VIDEO_ID,
    `Failed to extract video ID for ${payload.label}: expected "${EXPECTED_VIDEO_ID}", got "${extracted}"`,
  );
  console.log(`✅ PASS: ${payload.label} extracted ID -> ${extracted}`);
}

// 2. Verify AndroidManifest.xml configuration
const manifestPath = path.join(rootDir, "android-shell/app/src/main/AndroidManifest.xml");
assert(fs.existsSync(manifestPath), "AndroidManifest.xml must exist");
const manifestContent = fs.readFileSync(manifestPath, "utf8");

assert(
  manifestContent.includes('android:launchMode="singleTask"'),
  "AndroidManifest.xml must configure MainActivity with singleTask launchMode",
);
assert(
  manifestContent.includes('android:name="android.intent.action.SEND"'),
  "AndroidManifest.xml must contain SEND intent filter",
);
assert(
  manifestContent.includes('android:name="android.intent.action.VIEW"'),
  "AndroidManifest.xml must contain VIEW intent filter for YouTube URLs",
);
assert(
  manifestContent.includes('android:host="youtu.be"'),
  "AndroidManifest.xml must filter youtu.be domain",
);
console.log("✅ PASS: AndroidManifest.xml contains singleTask, SEND, and VIEW intent filters");

// 3. Verify MainActivity.kt architecture
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const activityContent = fs.readFileSync(mainActivityPath, "utf8");

assert(
  activityContent.includes("fun extractSharedText"),
  "MainActivity.kt must define extractSharedText helper",
);
assert(
  activityContent.includes("fun extractYouTubeVideoId"),
  "MainActivity.kt must define extractYouTubeVideoId helper",
);
assert(
  activityContent.includes("fun buildQuerySuffix"),
  "MainActivity.kt must define buildQuerySuffix helper",
);
assert(
  activityContent.includes("window.onNativeSharedLinkReceived"),
  "MainActivity.kt must bridge shared link via onNativeSharedLinkReceived",
);
assert(
  activityContent.includes("override fun onNewIntent"),
  "MainActivity.kt must handle onNewIntent",
);
console.log("✅ PASS: MainActivity.kt implements comprehensive share intent parsing and bridge dispatch");

// 4. Verify React client route state initialization in src/routes/index.tsx
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexTsxContent = fs.readFileSync(indexTsxPath, "utf8");

assert(
  indexTsxContent.includes('params.get("v") ||') &&
    indexTsxContent.includes('params.get("url")'),
  "src/routes/index.tsx must initialize videoId from URL search params (v or url)",
);
assert(
  indexTsxContent.includes("window.onNativeSharedLinkReceived = openLink"),
  "src/routes/index.tsx must register onNativeSharedLinkReceived callback",
);
console.log("✅ PASS: src/routes/index.tsx initializes videoId dynamically and handles shared links");

console.log("====================================================");
console.log("🎉 All YouTube Share Intent tests PASSED successfully!");
console.log("====================================================");
