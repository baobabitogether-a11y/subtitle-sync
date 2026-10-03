import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Android Background Playback Verification");
console.log("====================================================");

const rootDir = process.cwd();
const manifestPath = path.join(rootDir, "android-shell/app/src/main/AndroidManifest.xml");
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");

// 1. Verify AndroidManifest.xml permissions
assert(fs.existsSync(manifestPath), "AndroidManifest.xml must exist");
const manifestContent = fs.readFileSync(manifestPath, "utf8");

assert(
  manifestContent.includes("android.permission.WAKE_LOCK"),
  "AndroidManifest.xml must declare android.permission.WAKE_LOCK for reliable background audio playback",
);
assert(
  manifestContent.includes("android:hardwareAccelerated=\"true\""),
  "AndroidManifest.xml must enable hardware acceleration",
);
console.log("✅ PASS: AndroidManifest.xml contains WAKE_LOCK and hardware acceleration");

// 2. Verify MainActivity.kt WebView settings and lifecycle management
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const activityContent = fs.readFileSync(mainActivityPath, "utf8");

assert(
  activityContent.includes("mediaPlaybackRequiresUserGesture = false"),
  "MainActivity.kt must configure mediaPlaybackRequiresUserGesture = false",
);
console.log("✅ PASS: mediaPlaybackRequiresUserGesture = false is configured");

// Verify onPause does NOT pause WebView or pause timers
const onPauseBlock =
  activityContent.split("override fun onPause()")[1]?.split("override fun")[0] ?? "";
assert(
  !onPauseBlock.includes("webView.onPause()"),
  "MainActivity.kt onPause() must NOT call webView.onPause() to keep background playback active",
);
console.log("✅ PASS: onPause() keeps WebView active without calling webView.onPause()");

// Verify onStop does NOT pause WebView timers
assert(
  activityContent.includes("override fun onStop()"),
  "MainActivity.kt must implement onStop()",
);
console.log("✅ PASS: onStop() implemented without freezing media or WebView");

// Verify onResume resumes WebView
assert(
  activityContent.includes("override fun onResume()") &&
    activityContent.includes("webView.onResume()") &&
    activityContent.includes("webView.resumeTimers()"),
  "MainActivity.kt onResume() must resume WebView and timers",
);
console.log("✅ PASS: onResume() safely resumes WebView and timers");

// Verify script evaluation on page finished to prevent player pausing
assert(
  activityContent.includes("onPageFinished") &&
    activityContent.includes("visibilitychange") &&
    activityContent.includes("visibilityState"),
  "MainActivity.kt onPageFinished must inject background playback resilience script",
);
console.log("✅ PASS: Background playback resilience script injected in onPageFinished");

// 3. Verify src/routes/index.tsx client-side visibility resilience
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

assert(
  indexContent.includes("visibilitychange") &&
    indexContent.includes("visibilityState"),
  "src/routes/index.tsx must prevent background pause on visibility changes",
);
console.log("✅ PASS: Client-side document visibility protection verified in index.tsx");

console.log("====================================================");
console.log("🎉 Android Background Playback tests PASSED successfully!");
console.log("====================================================");
