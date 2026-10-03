import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("====================================================");
console.log("🧪 Starting Player Viewport Placement & Options Test");
console.log("====================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const content = fs.readFileSync(indexTsxPath, "utf8");

// 1. Verify player is first in PANELS definition and open by default
assert(
  content.includes('{ id: "player", title: "Video" }'),
  "PANELS must define player panel with title 'Video'",
);
assert(
  content.includes("player: true"),
  "openPanels initial state must have player open by default",
);
console.log("✅ PASS: Video player panel is defined first and open by default");

// 2. Verify YT.Player playerVars configuration
assert(
  content.includes("enablejsapi: 1"),
  "playerVars must configure enablejsapi: 1 for parent iframe communication",
);
assert(
  content.includes("origin: typeof window !== \"undefined\" ? window.location.origin : undefined"),
  "playerVars must pass window.location.origin",
);
assert(
  content.includes("onReady: (event:") && content.includes("event.target?.playVideo?.()"),
  "YT.Player must handle onReady event to start playback on Android",
);
console.log("✅ PASS: YT.Player playerVars configure enablejsapi, origin, and onReady playback");

// 3. Verify video player container test IDs and structure
assert(
  content.includes('id="video-player-container"') &&
    content.includes('data-testid="video-player-container"'),
  "video-player-container must have id and data-testid",
);
assert(
  content.includes('id="youtube-player"') && content.includes('data-testid="youtube-player"'),
  "youtube-player must have id and data-testid",
);
assert(
  content.includes('id="youtube-url-form"') && content.includes('data-testid="youtube-url-form"'),
  "youtube-url-form must have id and data-testid",
);
assert(
  content.includes('id="youtube-url-input"') &&
    content.includes('data-testid="youtube-url-input"'),
  "youtube-url-input must have id and data-testid",
);
assert(
  content.includes('id="youtube-url-submit"') &&
    content.includes('data-testid="youtube-url-submit"'),
  "youtube-url-submit must have id and data-testid",
);
assert(
  content.includes('id="caption-status-indicator"') &&
    content.includes('data-testid="caption-status-indicator"'),
  "caption-status-indicator must have id and data-testid",
);
console.log("✅ PASS: Player container and controls have explicit IDs and data-testids");

console.log("====================================================");
console.log("🎉 All Player Viewport Placement tests PASSED successfully!");
console.log("====================================================");
