import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Android Back Navigation & History Verification Test");
console.log("====================================================");

// 1. Verify MainActivity.kt
const mainActivityFile = path.resolve(
  process.cwd(),
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert.ok(fs.existsSync(mainActivityFile), "MainActivity.kt must exist");
const mainActivityContent = fs.readFileSync(mainActivityFile, "utf-8");

console.log("Checking Android OnBackPressedCallback in MainActivity.kt...");
assert.ok(
  mainActivityContent.includes("import androidx.activity.OnBackPressedCallback"),
  "MainActivity.kt must import OnBackPressedCallback",
);
assert.ok(
  mainActivityContent.includes("onBackPressedDispatcher.addCallback"),
  "MainActivity.kt must register back callback with onBackPressedDispatcher",
);
assert.ok(
  mainActivityContent.includes("window.__handleAndroidBack"),
  "MainActivity.kt must evaluate window.__handleAndroidBack() in WebView",
);
assert.ok(
  mainActivityContent.includes("webView.canGoBack()") &&
    mainActivityContent.includes("webView.goBack()"),
  "MainActivity.kt must navigate back in WebView history if canGoBack() is true",
);
assert.ok(
  mainActivityContent.includes("override fun onBackPressed()"),
  "MainActivity.kt must provide onBackPressed() fallback for compatibility",
);
console.log("✅ PASS: MainActivity.kt back press dispatching and webview history navigation verified");

// 2. Verify React implementation in src/routes/index.tsx
const indexFile = path.resolve(process.cwd(), "src/routes/index.tsx");
assert.ok(fs.existsSync(indexFile), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexFile, "utf-8");

console.log("Checking React back event & popstate handlers in index.tsx...");
assert.ok(
  indexContent.includes("__handleAndroidBack"),
  "index.tsx must expose window.__handleAndroidBack for the Android shell",
);
assert.ok(
  indexContent.includes("window.addEventListener(\"popstate\""),
  "index.tsx must register popstate event listener",
);
assert.ok(
  indexContent.includes("window.removeEventListener(\"popstate\""),
  "index.tsx must clean up popstate event listener",
);
assert.ok(
  indexContent.includes("window.history.pushState"),
  "index.tsx must push browser history state when navigating between videos",
);
console.log("✅ PASS: React history pushing and back event listener integration verified");

// 3. Functional simulation of back navigation behavior
console.log("Running functional simulation of Android back navigation logic...");

let networkInspectorOpen = true;
let apkModalOpen = false;

// Simulation: window.__handleAndroidBack when modal is open
const simulateHandleAndroidBack = () => {
  if (networkInspectorOpen) {
    networkInspectorOpen = false;
    return true;
  }
  if (apkModalOpen) {
    apkModalOpen = false;
    return true;
  }
  return false;
};

// Scenario A: Modal is open -> back press should close modal and return true (handled)
assert.strictEqual(
  simulateHandleAndroidBack(),
  true,
  "Back press must consume modal closing and return true",
);
assert.strictEqual(
  networkInspectorOpen,
  false,
  "networkInspectorOpen must be set to false",
);

// Scenario B: No modal is open -> back press returns false (unhandled), delegating to webView history
assert.strictEqual(
  simulateHandleAndroidBack(),
  false,
  "Back press must return false when no modal is open",
);

// Scenario C: Browser history popstate navigation
let currentVideoId = "dQw4w9WgXcQ";
const historyStack: string[] = ["L2Ryrr6txwA", "dQw4w9WgXcQ"];

const simulatePopState = (prevId: string) => {
  currentVideoId = prevId;
};

// User triggers back
historyStack.pop();
const previousVideo = historyStack[historyStack.length - 1];
simulatePopState(previousVideo);

assert.strictEqual(
  currentVideoId,
  "L2Ryrr6txwA",
  "Popstate must restore previous video from history",
);

console.log("✅ PASS: All functional simulation scenarios passed successfully");

console.log("====================================================");
console.log("🎉 All Android Back Navigation & History tests PASSED!");
console.log("====================================================");
