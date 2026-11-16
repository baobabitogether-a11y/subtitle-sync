import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { getOriginalTrackTextForRange, type Json3 } from "../src/lib/subtitles";
import {
  getShowOriginalSubtitlesPreference,
  setShowOriginalSubtitlesPreference,
} from "../src/lib/playback-preferences";

async function run() {
  console.log("==========================================================================");
  console.log("🧪 Verifying Subtitles-Table View: Show/Hide Original Record Beside Filtered");
  console.log("==========================================================================");

  // 1. Unit tests: getOriginalTrackTextForRange & preference helpers
  const sampleTrack: Json3 = {
    events: [
      { tStartMs: 0, dDurationMs: 2500, segs: [{ utf8: "[Music] >> Hello world." }] },
      { tStartMs: 2500, dDurationMs: 2500, segs: [{ utf8: "Second raw cue." }] },
    ],
  };
  const extracted0 = getOriginalTrackTextForRange(sampleTrack, 0, 2500);
  assert.equal(extracted0, "[Music] >> Hello world.");
  const extracted1 = getOriginalTrackTextForRange(sampleTrack, 2500, 5000);
  assert.equal(extracted1, "Second raw cue.");
  assert.equal(getOriginalTrackTextForRange(undefined, 0, 1000), "");

  assert.equal(getShowOriginalSubtitlesPreference(), false);
  setShowOriginalSubtitlesPreference(true);
  assert.equal(getShowOriginalSubtitlesPreference(), true);
  setShowOriginalSubtitlesPreference(false);
  assert.equal(getShowOriginalSubtitlesPreference(), false);
  console.log("✅ PASS: Unit tests for raw cue extraction & preference persistence.");

  // 2. Source & parity verification
  const rootDir = process.cwd();
  const panelSrc = fs.readFileSync(
    path.join(rootDir, "src/components/SubtitlesTablePanel.tsx"),
    "utf8",
  );
  const indexSrc = fs.readFileSync(path.join(rootDir, "src/routes/index.tsx"), "utf8");
  const storiesSrc = fs.readFileSync(
    path.join(rootDir, "src/components/SubtitlesTablePanel.stories.tsx"),
    "utf8",
  );

  assert.ok(panelSrc.includes('data-testid="toggle-original-subtitle-record-btn"'));
  assert.ok(panelSrc.includes('data-testid="subtitles-table-comparison-grid"'));
  assert.ok(panelSrc.includes('data-testid="filtered-subtitles-pane"'));
  assert.ok(panelSrc.includes('data-testid="original-subtitles-pane"'));
  assert.ok(storiesSrc.includes("WithOriginalBesideFiltered"));
  assert.equal(
    (indexSrc.match(/showOriginalRecords=\{showOriginalSubtitles\}/g) || []).length,
    2,
    "Both Beginner and Advanced SubtitlesTablePanel instances must receive showOriginalRecords",
  );
  assert.equal(
    (indexSrc.match(/rawRows=\{unfilteredOriginalRows\}/g) || []).length,
    2,
    "Both Beginner and Advanced SubtitlesTablePanel instances must receive rawRows={unfilteredOriginalRows}",
  );
  console.log("✅ PASS: Source parity across Advanced, Beginner & Storybook verified.");

  // 3. Live Playwright Chromium E2E against dev server (port 3000)
  const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
  const knownHeadlessPath =
    "/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell";
  const executablePath = fs.existsSync(knownHeadlessPath) ? knownHeadlessPath : undefined;
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  try {
    // Load demo page with fixture video L2Ryrr6txwA in Advanced Stage 0 and load authentic sample fixture
    await page.goto(`${baseUrl}/?mode=expert&video=L2Ryrr6txwA&stage=0`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector('[data-testid="btn-load-sample-subtitles"]', { timeout: 20000 });
    await page.getByTestId("btn-load-sample-subtitles").click();
    await page.getByTestId("stage-step-2").click();
    await page.waitForSelector('[data-testid="toggle-original-subtitle-record-btn"]', {
      timeout: 15000,
    });

    const tableBody = page.getByTestId("subtitles-table-body");
    const initialCount = await tableBody.locator('[data-testid^="subtitle-cue-row-"]').count();
    assert.ok(initialCount > 0, "Expected sample fixture rows to load");

    // Ensure Filter Out is active and tighten max words input to filter some records out
    await page.getByTestId("btn-criteria-action-filter").click();
    const maxWordsInput = page
      .locator(
        '[data-testid="learning-goals-max-words-input"], [data-testid="max-words-per-sentence-input"]',
      )
      .first();
    await maxWordsInput.fill("4");
    await maxWordsInput.dispatchEvent("change");

    const filteredCount = await tableBody.locator('[data-testid^="subtitle-cue-row-"]').count();
    assert.ok(
      filteredCount > 0 && filteredCount < initialCount,
      `Expected filteredCount (${filteredCount}) to be > 0 and < initialCount (${initialCount})`,
    );

    // Verify original pane is hidden by default
    assert.equal(await page.getByTestId("original-subtitles-pane").count(), 0);

    // Click Show Original button
    const toggleBtn = page.getByTestId("toggle-original-subtitle-record-btn");
    await toggleBtn.click();
    await page.waitForSelector('[data-testid="original-subtitles-pane"]', { timeout: 5000 });

    const filteredBox = await page.getByTestId("filtered-subtitles-pane").boundingBox();
    const originalBox = await page.getByTestId("original-subtitles-pane").boundingBox();
    assert.ok(
      filteredBox && originalBox,
      "Both filtered and original panes must have layout boxes",
    );
    assert.ok(
      originalBox.x >= filteredBox.x + filteredBox.width - 8,
      `Original pane (x=${originalBox.x}) must appear beside Filtered pane (right=${filteredBox.x + filteredBox.width})`,
    );

    const originalCount = await page
      .getByTestId("original-subtitles-table-body")
      .locator('[data-testid^="original-subtitle-row-"]')
      .count();
    assert.ok(
      originalCount >= initialCount && originalCount > filteredCount,
      `Original pane count (${originalCount}) must be >= initial (${initialCount}) and > filtered (${filteredCount})`,
    );
    const filteredBadgeCount = await page
      .getByTestId("original-subtitles-table-body")
      .locator('[data-original-row-kept="false"]')
      .count();
    assert.ok(
      filteredBadgeCount > 0,
      `Expected filtered-out original rows to be marked as Filtered beside filtered pane (found ${filteredBadgeCount})`,
    );

    // Verify state survives switching to Beginner mode (shared component & preference parity)
    await page.goto(`${baseUrl}/?mode=beginner&video=L2Ryrr6txwA`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector('[data-testid="beginner-tab-video"]', { timeout: 15000 });
    await page.getByTestId("beginner-tab-video").click();
    await page.waitForSelector('[data-testid="original-subtitles-pane"]', { timeout: 15000 });

    const beginnerFilteredBox = await page.getByTestId("filtered-subtitles-pane").boundingBox();
    const beginnerOriginalBox = await page.getByTestId("original-subtitles-pane").boundingBox();
    assert.ok(beginnerFilteredBox && beginnerOriginalBox, "Beginner panes must have layout boxes");
    assert.ok(
      beginnerOriginalBox.x >= beginnerFilteredBox.x + beginnerFilteredBox.width - 8,
      "Original pane must appear beside Filtered pane in Beginner mode too",
    );

    // Toggle Hide Original in Beginner mode and verify hidden
    await page.getByTestId("toggle-original-subtitle-record-btn").click();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="original-subtitles-pane"]').length === 0,
      { timeout: 5000 },
    );

    // Check zero FloatingErrorButton / page errors
    const errBtnCount = await page.locator('[data-testid="floating-error-button"]').count();
    assert.equal(errBtnCount, 0, "FloatingErrorButton must not appear");
    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join("; ")}`);
    const unexpectedConsoleErrors = consoleErrors.filter(
      (e) =>
        !e.includes("WebSocket") &&
        !e.includes("favicon") &&
        !e.includes("clients5.google.com") &&
        !e.includes("compute-pressure") &&
        !e.includes("ERR_FAILED"),
    );
    assert.equal(
      unexpectedConsoleErrors.length,
      0,
      `Unexpected console errors: ${unexpectedConsoleErrors.join("; ")}`,
    );

    console.log(
      `✅ PASS: Live Chromium E2E passed (filtered=${filteredCount}, original=${originalCount}, side-by-side verified across Advanced & Beginner).`,
    );
  } finally {
    await browser.close();
  }

  console.log("==========================================================================");
  console.log("🎉 Subtitles-Table Original Beside Filtered Verification PASSED!");
  console.log("==========================================================================");
}

run().catch((err) => {
  console.error("❌ FAIL:", err);
  process.exit(1);
});
