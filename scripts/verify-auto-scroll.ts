import assert from "node:assert/strict";
import {
  getAutoScrollSetting,
  setAutoScrollSetting,
  AUTO_SCROLL_STORAGE_KEY,
} from "../src/utils/appSettings";

console.log("====================================================");
console.log("🧪 Starting Auto-Scroll Default Test Suite (Subtask 16.4)");
console.log("====================================================");

// Mock localStorage in Node environment
const storage = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, val: string) => storage.set(key, val),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
};

// Test 1: Default setting is OFF (false)
storage.clear();
const defaultVal = getAutoScrollSetting();
assert.equal(defaultVal, false, "Auto-scroll setting must default to false (OFF)");
console.log("✅ PASS: Default auto-scroll setting is OFF (false)");

// Test 2: Persisting state changes
setAutoScrollSetting(true);
assert.equal(getAutoScrollSetting(), true, "Should return true after enabling");
assert.equal(storage.get(AUTO_SCROLL_STORAGE_KEY), "true");
console.log("✅ PASS: setAutoScrollSetting(true) updates localStorage");

setAutoScrollSetting(false);
assert.equal(getAutoScrollSetting(), false, "Should return false after disabling");
assert.equal(storage.get(AUTO_SCROLL_STORAGE_KEY), "false");
console.log("✅ PASS: setAutoScrollSetting(false) updates localStorage");

// Test 3: Corrupt or unknown values default safely to false
storage.set(AUTO_SCROLL_STORAGE_KEY, "invalid_string");
assert.equal(getAutoScrollSetting(), false, "Invalid values must resolve to false");
console.log("✅ PASS: Invalid storage values fall back safely to false");

console.log("====================================================");
console.log("📊 AUTO-SCROLL TEST SUMMARY: All tests passed!");
console.log("====================================================");
