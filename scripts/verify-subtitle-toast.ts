import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  notifySubtitleFetch,
  dismissSubtitleNotification,
  subscribeSubtitleNotification,
  isSubtitleNotificationMuted,
  setSubtitleNotificationMuted,
  type SubtitleFetchNotification,
} from "../src/utils/subtitleNotificationManager";

console.log("====================================================");
console.log("🧪 Starting Subtitle Fetch Popup Notification Verification");
console.log("====================================================");

// 1. Initial State
assert.strictEqual(isSubtitleNotificationMuted(), false, "Notification should not be muted initially");
console.log("✅ PASS: Default unmuted state verified");

// 2. Notification emission and subscription
let received: SubtitleFetchNotification | null = null;
const unsubscribe = subscribeSubtitleNotification((notification) => {
  received = notification;
});

notifySubtitleFetch("fetching", "Fetching live subtitles for Spanish (es)…", "es", "Spanish");
assert.ok(received !== null, "Notification should be received");
assert.strictEqual(received?.status, "fetching");
assert.strictEqual(received?.langCode, "es");
assert.strictEqual(received?.message, "Fetching live subtitles for Spanish (es)…");
console.log("✅ PASS: Fetching status notification broadcast verified");

// 3. Completed notification
notifySubtitleFetch("completed", "Subtitles successfully loaded for Spanish (es)", "es", "Spanish");
assert.strictEqual(received?.status, "completed");
console.log("✅ PASS: Completed status notification broadcast verified");

// 4. Dismiss notification
dismissSubtitleNotification();
assert.strictEqual(received, null, "Notification should be null after dismiss");
console.log("✅ PASS: Dismiss notification verified");

// 5. Mute functionality
setSubtitleNotificationMuted(true);
assert.strictEqual(isSubtitleNotificationMuted(), true, "Should report muted as true");

notifySubtitleFetch("fetching", "Should not be delivered when muted", "fr", "French");
assert.strictEqual(received, null, "Notifications must not be dispatched when muted");
console.log("✅ PASS: Mute functionality successfully prevents notifications");

// Reset mute
setSubtitleNotificationMuted(false);
assert.strictEqual(isSubtitleNotificationMuted(), false);
unsubscribe();

// 6. Component Contract Verification
const toastComponentPath = path.resolve(process.cwd(), "src/components/SubtitleFetchToast.tsx");
assert.ok(fs.existsSync(toastComponentPath), "SubtitleFetchToast.tsx must exist");
const toastCode = fs.readFileSync(toastComponentPath, "utf-8");

assert.ok(
  toastCode.includes("data-testid=\"subtitle-fetch-toast\""),
  "Must include data-testid for the toast container",
);
assert.ok(
  toastCode.includes("data-testid=\"toast-view-subtitles-link\""),
  "Must include data-testid for quick link to view subtitles",
);
assert.ok(
  toastCode.includes("data-testid=\"mute-subtitle-notifications-checkbox\""),
  "Must include data-testid for muting further notifications",
);
console.log("✅ PASS: SubtitleFetchToast component contract elements verified");
console.log("🎉 All Subtitle Toast Verification Tests Passed!");
