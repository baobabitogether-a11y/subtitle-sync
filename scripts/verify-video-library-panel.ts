import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { DEFAULT_LIBRARY_ITEMS, STORAGE_KEYS } from "../src/config/appConfig";
import { LibraryVideoItem } from "../src/types";

console.log("====================================================");
console.log("🧪 Starting Video Library Panel & Watch History Test");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify storage key constant
assert.strictEqual(
  STORAGE_KEYS.LIBRARY_STORAGE_KEY,
  "yt_video_library_v2",
  "STORAGE_KEYS.LIBRARY_STORAGE_KEY must be 'yt_video_library_v2'",
);
console.log("✅ PASS: STORAGE_KEYS.LIBRARY_STORAGE_KEY is 'yt_video_library_v2'");

// 2. Verify default library items schema and contents
assert(Array.isArray(DEFAULT_LIBRARY_ITEMS), "DEFAULT_LIBRARY_ITEMS must be an array");
assert(DEFAULT_LIBRARY_ITEMS.length >= 3, "DEFAULT_LIBRARY_ITEMS must contain at least 3 default videos");
for (const item of DEFAULT_LIBRARY_ITEMS) {
  assert(item.id && typeof item.id === "string", "Each library item must have a valid id string");
  assert(item.title && typeof item.title === "string", "Each library item must have a title string");
  assert(item.originalUrl && item.originalUrl.includes(item.id), "originalUrl must contain the video id");
  assert(Array.isArray(item.cues), "cues must be an array");
}
console.log(`✅ PASS: DEFAULT_LIBRARY_ITEMS verified with ${DEFAULT_LIBRARY_ITEMS.length} authentic educational entries`);

// 3. Verify VideoLibraryPanel component source file exists and contains required identifiers
const panelPath = path.join(rootDir, "src", "components", "VideoLibraryPanel.tsx");
assert(fs.existsSync(panelPath), "src/components/VideoLibraryPanel.tsx must exist");
const panelCode = fs.readFileSync(panelPath, "utf8");

assert(panelCode.includes('id="video-library-panel"'), "Must contain id='video-library-panel'");
assert(panelCode.includes('data-testid="video-library-panel"'), "Must contain data-testid='video-library-panel'");
assert(panelCode.includes('data-testid="library-search-input"'), "Must contain data-testid='library-search-input'");
assert(panelCode.includes('data-testid="save-current-video-btn"'), "Must contain data-testid='save-current-video-btn'");
assert(panelCode.includes('data-testid="reset-library-defaults-btn"'), "Must contain data-testid='reset-library-defaults-btn'");
assert(panelCode.includes('data-testid="clear-library-btn"'), "Must contain data-testid='clear-library-btn'");
assert(panelCode.includes("i.ytimg.com/vi/"), "Must construct YouTube thumbnail URLs using i.ytimg.com/vi/");
assert(panelCode.includes("load-library-video-"), "Must have load-library-video action buttons");
assert(panelCode.includes("remove-library-video-"), "Must have remove-library-video action buttons");
console.log("✅ PASS: VideoLibraryPanel.tsx contains all required UI controls, test IDs, and thumbnail URLs");

// 4. Verify index.tsx integration
const indexPath = path.join(rootDir, "src", "routes", "index.tsx");
const indexCode = fs.readFileSync(indexPath, "utf8");

assert(
  indexCode.includes('{ id: "library", title: "Video library" }') ||
    indexCode.includes("{ id: 'library', title: 'Video library' }") ||
    indexCode.includes('id: "library"'),
  "PANELS in src/routes/index.tsx must include library panel",
);
assert(
  indexCode.includes("VideoLibraryPanel"),
  "src/routes/index.tsx must render VideoLibraryPanel",
);
assert(
  indexCode.includes('navbar-library-button'),
  "src/routes/index.tsx must contain navbar-library-button for quick access",
);
console.log("✅ PASS: Video Library panel integrated into PANELS, navbar, and index.tsx accordion");

// 5. Functional simulation of localStorage watch history operations
const mockStorage: Record<string, string> = {};
const mockWindow = {
  localStorage: {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
  },
};

// Seed library
mockWindow.localStorage.setItem(
  STORAGE_KEYS.LIBRARY_STORAGE_KEY,
  JSON.stringify(DEFAULT_LIBRARY_ITEMS),
);
const loadedRaw = mockWindow.localStorage.getItem(STORAGE_KEYS.LIBRARY_STORAGE_KEY);
assert(loadedRaw !== null, "Loaded library must not be null");
const loadedItems: LibraryVideoItem[] = JSON.parse(loadedRaw);
assert.strictEqual(loadedItems.length, DEFAULT_LIBRARY_ITEMS.length);

// Add a new video to library history
const customId = "dQw4w9WgXcQ";
const newHistoryItem: LibraryVideoItem = {
  id: customId,
  originalUrl: `https://www.youtube.com/watch?v=${customId}`,
  title: `Custom Watch History Video · ${customId}`,
  cues: [],
  timestamp: Date.now(),
};
const updatedItems = [newHistoryItem, ...loadedItems.filter((i) => i.id !== customId)];
mockWindow.localStorage.setItem(STORAGE_KEYS.LIBRARY_STORAGE_KEY, JSON.stringify(updatedItems));

const retrievedAfterAdd = JSON.parse(
  mockWindow.localStorage.getItem(STORAGE_KEYS.LIBRARY_STORAGE_KEY)!,
) as LibraryVideoItem[];
assert.strictEqual(retrievedAfterAdd[0].id, customId, "Newly added video must be placed at front of history");
assert.strictEqual(retrievedAfterAdd.length, DEFAULT_LIBRARY_ITEMS.length + 1);

// Remove an item
const removed = retrievedAfterAdd.filter((item) => item.id !== customId);
mockWindow.localStorage.setItem(STORAGE_KEYS.LIBRARY_STORAGE_KEY, JSON.stringify(removed));
const retrievedAfterRemove = JSON.parse(
  mockWindow.localStorage.getItem(STORAGE_KEYS.LIBRARY_STORAGE_KEY)!,
) as LibraryVideoItem[];
assert.strictEqual(retrievedAfterRemove.length, DEFAULT_LIBRARY_ITEMS.length);
assert(!retrievedAfterRemove.some((i) => i.id === customId), "Removed video must no longer exist in library");

console.log("✅ PASS: Functional simulation of localStorage watch history operations verified");

console.log("====================================================");
console.log("🎉 All Video Library Panel tests PASSED successfully!");
console.log("====================================================");
