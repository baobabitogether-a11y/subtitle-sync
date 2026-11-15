import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

console.log("=========================================================================");
console.log("🧪 Verifying Prompt 211 (Tasks 422–424):");
console.log("   1. Removed redundant 'Parallel Viewer' (#tab-viewer) & debug-gated #top-tabs-nav");
console.log("   2. History Stage strictly visible in Debug Mode across Advanced & Beginner modes");
console.log("   3. Floating Settings Button shows OpenRouter API Key & TTS-Service Token Valid/Missing + Click-to-Update");
console.log("=========================================================================");

// --- Step 1: Unit Tests for src/utils/credentialStatus.ts ---
class MockLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, val: string): void {
    this.store.set(key, String(val));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const mockStorage = new MockLocalStorage();
let dispatchedCredentialEvents = 0;
const prevWindow = (globalThis as unknown as { window?: unknown }).window;
const prevLocalStorage = (globalThis as unknown as { localStorage?: unknown }).localStorage;
const prevCustomEvent = (globalThis as unknown as { CustomEvent?: unknown }).CustomEvent;

(globalThis as unknown as { localStorage: Storage }).localStorage = mockStorage as unknown as Storage;
(globalThis as unknown as { window: unknown }).window = {
  localStorage: mockStorage,
  location: { search: "" },
  dispatchEvent: (evt: { type?: string }) => {
    if (evt?.type === "yt-credentials-updated") {
      dispatchedCredentialEvents += 1;
    }
    return true;
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};
(globalThis as unknown as { CustomEvent?: unknown }).CustomEvent = class {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
};

const {
  getCredentialStatusSnapshot,
  saveFloatingOpenRouterKey,
  saveFloatingTtsServiceToken,
  verifyOpenRouterCredential,
} = await import("../src/utils/credentialStatus");

// Initially both should be missing
mockStorage.clear();
const initialSnap = getCredentialStatusSnapshot();
assert.equal(initialSnap.openRouter.status, "missing", "OpenRouter should initially be missing");
assert.equal(initialSnap.ttsToken.status, "missing", "TTS-Service token should initially be missing");

// Saving OpenRouter API key marks only OpenRouter valid & preserves missing TTS token
const afterOr = saveFloatingOpenRouterKey("sk-or-v1-unit-test-key");
assert.equal(afterOr.openRouter.status, "valid", "OpenRouter status must transition to valid");
assert.equal(afterOr.ttsToken.status, "missing", "TTS token must remain missing");
assert.ok(dispatchedCredentialEvents >= 1, "Saving OpenRouter key must emit yt-credentials-updated");

// Saving TTS-Service token (with Bearer prefix) strips Bearer, marks TTS valid, and keeps OpenRouter valid
const afterTts = saveFloatingTtsServiceToken("Bearer spk_unit_test_token_123");
assert.equal(afterTts.ttsToken.status, "valid", "TTS token status must transition to valid");
assert.equal(afterTts.openRouter.status, "valid", "Saving TTS token must NOT clobber OpenRouter key");
assert.equal(
  mockStorage.getItem("yt_speak_api_token_v1"),
  "spk_unit_test_token_123",
  "TTS token must strip leading 'Bearer '",
);

// Entering a Speak token (spk_) into OpenRouter input marks it invalid with diagnostic hint
const badOr = saveFloatingOpenRouterKey("spk_accidental_wrong_slot");
assert.equal(badOr.openRouter.status, "invalid", "spk_ token saved as OpenRouter key must mark invalid");

// Verify OpenRouter key with mocked 401 -> invalid, then saving new key resets cache
saveFloatingOpenRouterKey("sk-or-v1-bad-key");
const origFetch = globalThis.fetch;
globalThis.fetch = (async () =>
  new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })) as typeof fetch;
const failedVerify = await verifyOpenRouterCredential();
assert.equal(failedVerify.ok, false);
assert.equal(failedVerify.status, "invalid");
assert.equal(
  getCredentialStatusSnapshot().openRouter.status,
  "invalid",
  "Cached invalid OpenRouter state should persist for matching key fingerprint",
);
const restoredSnap = saveFloatingOpenRouterKey("sk-or-v1-fresh-key");
assert.equal(
  restoredSnap.openRouter.status,
  "valid",
  "Saving a new key must clear stale invalid cache immediately",
);
globalThis.fetch = origFetch;
if (prevWindow === undefined) {
  delete (globalThis as unknown as { window?: unknown }).window;
} else {
  (globalThis as unknown as { window?: unknown }).window = prevWindow;
}
if (prevLocalStorage === undefined) {
  delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
} else {
  (globalThis as unknown as { localStorage?: unknown }).localStorage = prevLocalStorage;
}
if (prevCustomEvent === undefined) {
  delete (globalThis as unknown as { CustomEvent?: unknown }).CustomEvent;
} else {
  (globalThis as unknown as { CustomEvent?: unknown }).CustomEvent = prevCustomEvent;
}

console.log("✅ Step 1 PASS: credentialStatus unit behavior & token isolation verified.");

// --- Step 2: Source Contracts ---
const root = process.cwd();
const indexSource = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");
const floatingSource = fs.readFileSync(
  path.join(root, "src/components/FloatingDraggablePauseButton.tsx"),
  "utf8",
);
const floatingStoriesSource = fs.readFileSync(
  path.join(root, "src/components/FloatingDraggablePauseButton.stories.tsx"),
  "utf8",
);

assert.ok(
  !indexSource.includes('data-testid="tab-viewer"'),
  "Redundant tab-viewer must be removed from src/routes/index.tsx",
);
assert.ok(
  indexSource.includes('workflowMode === "expert" && isDeveloperMode'),
  "#top-tabs-nav must be gated on developer/debug mode in src/routes/index.tsx",
);
assert.ok(
  indexSource.includes("{debugMode && (") &&
    indexSource.includes('id="stage-step-history"') &&
    indexSource.includes("{debugMode && currentAccordionStage === 6 && (") &&
    indexSource.includes("historyStageSlot={\n              debugMode ? ("),
  "History stage must be strictly gated by debugMode across Advanced and Beginner modes",
);
assert.ok(
  floatingSource.includes('data-testid="floating-openrouter-status-indicator"') &&
    floatingSource.includes('data-testid="floating-tts-token-status-indicator"') &&
    floatingSource.includes('data-testid="floating-menu-openrouter-item"') &&
    floatingSource.includes('data-testid="floating-menu-tts-token-item"'),
  "FloatingDraggablePauseButton must expose OpenRouter & TTS-Service indicators and click-to-update editors",
);
assert.ok(
  floatingStoriesSource.includes("CredentialsMissingState") &&
    floatingStoriesSource.includes("CredentialsValidState"),
  "FloatingDraggablePauseButton.stories.tsx must include credential status stories",
);

console.log("✅ Step 2 PASS: Source contracts & Storybook parity verified.");

// --- Step 3: Live Chromium E2E Verification ---
const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const knownHeadlessPath =
  "/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell";
const executablePath = fs.existsSync(knownHeadlessPath) ? knownHeadlessPath : undefined;
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (err) => pageErrors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const txt = msg.text();
      if (
        txt.includes("clients5.google.com") ||
        txt.includes("Failed to load resource: net::ERR_FAILED")
      ) {
        return;
      }
      consoleErrors.push(txt);
    }
  });

  const waitForTestId = async (testId: string, timeout = 25000) => {
    try {
      await page.getByTestId(testId).waitFor({ state: "visible", timeout });
    } catch (err) {
      console.error(`DIAG FAILED waiting for [${testId}] URL:`, page.url());
      console.error("DIAG PAGEERRORS:", pageErrors);
      console.error("DIAG CONSOLE_ERRORS:", consoleErrors);
      console.error("DIAG BODY:", (await page.locator("body").innerText()).slice(0, 600));
      throw err;
    }
  };

  // 3A. Non-debug mode checks (Advanced & Beginner)
  await page.goto(`${baseUrl}/robots.txt`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("app_workflow_mode", "expert");
    localStorage.setItem("yt_debug_mode", "false");
  });
  await page.goto(`${baseUrl}/?mode=expert&debug=false`, { waitUntil: "domcontentloaded" });
  await waitForTestId("stage-step-1");

  assert.equal(await page.getByTestId("tab-viewer").count(), 0, "tab-viewer must not render");
  assert.equal(
    await page.getByTestId("top-tabs-nav").count(),
    0,
    "#top-tabs-nav must not render when debugMode is off",
  );
  assert.equal(
    await page.getByTestId("stage-step-history").count(),
    0,
    "Advanced stage-step-history must be hidden when debugMode is off",
  );

  // Even ?stage=history without debug=true must NOT show History stage
  await page.goto(`${baseUrl}/?mode=expert&debug=false&stage=history`, { waitUntil: "domcontentloaded" });
  await waitForTestId("stage-step-1");
  assert.equal(
    await page.getByTestId("advanced-history-stage-container").count(),
    0,
    "?stage=history must not display History stage when debug=false",
  );

  // Beginner mode without debug=true must also hide History stage
  await page.goto(`${baseUrl}/?mode=beginner&debug=false`, { waitUntil: "domcontentloaded" });
  await waitForTestId("beginner-tab-video");
  await page.getByTestId("beginner-tab-video").click();
  await page.waitForTimeout(300);
  assert.equal(
    await page.getByTestId("beginner-history-stage-toggle").count(),
    0,
    "Beginner History stage toggle must be hidden when debugMode is off",
  );

  console.log("✅ Step 3A PASS: Non-debug UI cleanly omits Parallel Viewer & History Stage across both modes.");

  // 3B. Debug mode ON: History stage visible in Advanced & Beginner, #top-tabs-nav shown WITHOUT tab-viewer
  await page.goto(`${baseUrl}/?mode=expert&debug=true`, { waitUntil: "domcontentloaded" });
  await waitForTestId("stage-step-history");
  assert.equal(await page.getByTestId("tab-viewer").count(), 0, "tab-viewer must remain removed in debug mode");
  await waitForTestId("top-tabs-nav");
  await page.getByTestId("stage-step-history").click();
  await waitForTestId("advanced-history-stage-container");
  await waitForTestId("tts-play-history-panel");

  await page.goto(`${baseUrl}/?mode=beginner&debug=true`, { waitUntil: "domcontentloaded" });
  await waitForTestId("beginner-tab-video");
  await page.getByTestId("beginner-tab-video").click();
  await waitForTestId("beginner-history-stage-toggle");
  await page.getByTestId("beginner-history-stage-toggle").click();
  await waitForTestId("tts-play-history-panel");

  console.log("✅ Step 3B PASS: Debug Mode reveals History Stage in both Advanced & Beginner modes.");

  // 3C. Floating Settings Button: OpenRouter API Key & TTS-Service Token Indication + Click-to-Update
  await page.goto(`${baseUrl}/?mode=expert&debug=false`, { waitUntil: "domcontentloaded" });
  await waitForTestId("floating-menu-toggle-btn");

  const orChip = page.getByTestId("floating-openrouter-status-indicator");
  const ttsChip = page.getByTestId("floating-tts-token-status-indicator");
  assert.equal(await orChip.getAttribute("data-status"), "missing");
  assert.equal(await ttsChip.getAttribute("data-status"), "missing");
  assert.ok((await orChip.textContent())?.includes("Missing"));
  assert.ok((await ttsChip.textContent())?.includes("Missing"));

  // Click OpenRouter indicator directly on floating settings button to update it
  await orChip.click();
  await page.getByTestId("floating-openrouter-editor").waitFor({ state: "visible" });
  await page.getByTestId("floating-openrouter-key-input").fill("sk-or-v1-live-test-211");
  await page.getByTestId("floating-openrouter-save-btn").click();

  assert.equal(await orChip.getAttribute("data-status"), "valid");
  assert.ok((await orChip.textContent())?.includes("Valid"));
  assert.equal(
    await page.getByTestId("floating-menu-openrouter-badge").getAttribute("data-status"),
    "valid",
  );
  // TTS token should still be missing
  assert.equal(await ttsChip.getAttribute("data-status"), "missing");

  // Click TTS-Service token indicator directly on floating settings button to update it
  await ttsChip.click();
  await page.getByTestId("floating-tts-token-editor").waitFor({ state: "visible" });
  await page.getByTestId("floating-tts-token-input").fill("spk_live_test_token_211");
  await page.getByTestId("floating-tts-token-save-btn").click();

  assert.equal(await ttsChip.getAttribute("data-status"), "valid");
  assert.ok((await ttsChip.textContent())?.includes("Valid"));
  assert.equal(
    await page.getByTestId("floating-menu-tts-token-badge").getAttribute("data-status"),
    "valid",
  );

  // Confirm both keys are cleanly persisted separately in localStorage
  const storedOr = await page.evaluate(() => localStorage.getItem("yt_openrouter_api_key"));
  const storedTts = await page.evaluate(() =>
    localStorage.getItem("yt_speak_api_token_v1"),
  );
  assert.equal(storedOr, "sk-or-v1-live-test-211");
  assert.equal(storedTts, "spk_live_test_token_211");

  const floatingErrorCount = await page.getByTestId("floating-error-button").count();
  assert.equal(floatingErrorCount, 0, "Expected 0 FloatingErrorButton triggers");
  assert.equal(pageErrors.length, 0, `Expected 0 pageerrors, got: ${pageErrors.join("; ")}`);
  assert.equal(
    consoleErrors.length,
    0,
    `Expected 0 console errors, got: ${consoleErrors.join("; ")}`,
  );

  console.log("✅ Step 3C PASS: Floating settings credential status indicators & click-to-update verified live.");
} finally {
  await browser.close();
}

console.log("=========================================================================");
console.log("🎉 ALL PROMPT 211 VERIFICATION TESTS PASSED!");
console.log("=========================================================================");
