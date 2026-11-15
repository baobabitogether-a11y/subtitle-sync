import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { chromium } from "playwright";
import {
  buildYouTubeApiSubtitleSummary,
  buildYouTubeApiSubtitleTracks,
  normalizeYouTubeApiLangCode,
} from "../src/utils/youtubeApiSubtitleTracks";
import type { NetworkRequestRecord } from "../src/utils/networkTracker";

console.log("=== Running verify-youtube-api-default-auto-translations-switcher.ts ===");

// 1. Unit Tests: buildYouTubeApiSubtitleSummary & buildYouTubeApiSubtitleTracks
{
  const videoId = "L2Ryrr6txwA";
  const networkRequests: NetworkRequestRecord[] = [
    {
      id: "req-list",
      url: `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`,
      method: "GET",
      type: "fetch",
      startTime: 100,
      status: 200,
      fullResponseBody: "<transcript_list></transcript_list>",
    },
    {
      id: "req-default",
      url: `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
      method: "GET",
      type: "timedtext_interception",
      startTime: 150,
      status: 200,
      fullResponseBody: '{"events":[{"tStartMs":0,"dDurationMs":1000,"segs":[{"utf8":"Hello"}]}]}',
    },
    {
      id: "req-tlang-he",
      url: `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&tlang=he&fmt=json3`,
      method: "GET",
      type: "fetch",
      startTime: 200,
      status: 200,
      fullResponseBody: '{"events":[{"tStartMs":0,"dDurationMs":1000,"segs":[{"utf8":"שלום"}]}]}',
    },
    {
      id: "req-other-video",
      url: "https://www.youtube.com/api/timedtext?v=OTHERVIDEO1&lang=fr&tlang=de&fmt=json3",
      method: "GET",
      type: "fetch",
      startTime: 250,
      status: 200,
      fullResponseBody: '{"events":[{"tStartMs":0,"dDurationMs":1000,"segs":[{"utf8":"Hallo"}]}]}',
    },
  ];

  const summary = buildYouTubeApiSubtitleSummary({
    videoId,
    availableCaptionTracks: [
      {
        langCode: "en",
        name: "English",
        isDefault: true,
        isAsr: false,
        trackUrl: `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
      },
      {
        langCode: "en",
        name: "English (auto-generated)",
        isDefault: false,
        isAsr: true,
        trackUrl: `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=json3`,
      },
    ],
    defaultApiLang: "en",
    observedUrl: `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
    youtubeTranslatedLanguages: ["iw", "es"],
    networkRequests,
    tracks: {
      en: {
        events: [{ tStartMs: 0, dDurationMs: 1200, segs: [{ utf8: "Hello world" }] }],
      },
    },
  });

  assert.strictEqual(
    normalizeYouTubeApiLangCode("iw"),
    "he",
    "Legacy YouTube 'iw' must normalize to 'he'",
  );
  assert.strictEqual(summary.trackListRequestStatus, 200, "Tracks timedtext?type=list HTTP status");
  assert.ok(summary.defaultEntry, "Must identify default YouTube API entry");
  assert.strictEqual(summary.defaultEntry?.langCode, "en");
  assert.strictEqual(summary.defaultEntry?.kind, "default");
  assert.strictEqual(summary.asrCount, 1, "Must include ASR track from timedtext?type=list");
  assert.strictEqual(
    summary.autoTranslationCount,
    2,
    "Must dedupe iw/he and keep he + es auto-translation entries",
  );
  assert.strictEqual(
    summary.entries.some((e) => e.langCode === "de" || e.langCode === "fr"),
    false,
    "Must exclude timedtext requests belonging to another videoId",
  );
  const esAuto = summary.entries.find((e) => e.langCode === "es" && e.isAutoTranslation);
  assert.ok(esAuto?.requestUrl?.includes("tlang=es"), "Must synthesize tlang=es API URL cleanly");

  const entries = buildYouTubeApiSubtitleTracks({
    videoId,
    youtubeTranslatedLanguages: ["he"],
    observedUrl: `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
  });
  assert.strictEqual(entries.length, 2, "Must expose both observed default and tlang entry");
  console.log("✓ Unit tests for buildYouTubeApiSubtitleSummary passed");
}

// 2. Source & Same-Components Parity assertions
{
  const root = process.cwd();
  const barSrc = fs.readFileSync(
    path.join(root, "src/components/SwitchableDefaultSubtitlesBar.tsx"),
    "utf8",
  );
  const storiesSrc = fs.readFileSync(
    path.join(root, "src/components/SwitchableDefaultSubtitlesBar.stories.tsx"),
    "utf8",
  );
  const workbenchSrc = fs.readFileSync(
    path.join(root, "src/storybook/StorybookWorkbench.tsx"),
    "utf8",
  );
  const playgroundSrc = fs.readFileSync(
    path.join(root, "src/components/VideoPlayground.tsx"),
    "utf8",
  );
  const indexSrc = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");

  assert.ok(
    barSrc.includes('id="youtube-api-default-auto-translations-container"') &&
      barSrc.includes('data-testid="youtube-api-default-auto-translations-container"') &&
      barSrc.includes('data-testid="refresh-youtube-api-tracks-btn"'),
    "SwitchableDefaultSubtitlesBar must render the YouTube API Default & Auto-Translation container",
  );
  assert.ok(
    storiesSrc.includes("WithYouTubeApiDefaultAndAutoTranslation") &&
      workbenchSrc.includes("availableCaptionTracks="),
    "Storybook stories and StorybookWorkbench must showcase YouTube API Default & Auto-Translation switcher",
  );
  assert.ok(
    playgroundSrc.includes("availableCaptionTracks={availableCaptionTracks}") &&
      playgroundSrc.includes("onSwitchApiTrack={onSwitchApiTrack}"),
    "VideoPlayground must forward YouTube API switcher props to SwitchableDefaultSubtitlesBar",
  );

  const switcherPropsCount = (
    indexSrc.match(/onSwitchApiTrack=\{handleSwitchYouTubeApiTrack\}/g) || []
  ).length;
  assert.ok(
    switcherPropsCount >= 3,
    `Beginner Mode, Advanced Stage 3, and VideoPlayground must all receive onSwitchApiTrack (found ${switcherPropsCount})`,
  );
  console.log("✓ Source & Same-Components Parity assertions passed");
}

// 3. Live Playwright Chromium E2E test against localhost dev server
const APP_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

async function runLiveE2E() {
  const knownHeadlessPath =
    "/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell";
  const executablePath = fs.existsSync(knownHeadlessPath) ? knownHeadlessPath : undefined;

  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => {
    console.error("[PAGEERROR]", err.message);
    pageErrors.push(err.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const txt = msg.text();
      if (!txt.includes("favicon") && !txt.includes("WebSocket")) {
        console.error("[CONSOLE_ERROR]", txt);
        consoleErrors.push(txt);
      }
    }
  });

  // Intercept YouTube timedtext API requests deterministically in Chromium
  const interceptedUrls: string[] = [];
  await page.route("https://www.youtube.com/api/timedtext*", async (route) => {
    const url = route.request().url();
    interceptedUrls.push(url);
    const parsed = new URL(url);
    if (parsed.searchParams.get("type") === "list") {
      await route.fulfill({
        status: 200,
        contentType: "text/xml; charset=utf-8",
        body: [
          '<?xml version="1.0" encoding="utf-8" ?>',
          "<transcript_list>",
          '<track id="0" name="" lang_code="en" lang_original="English" lang_default="true" />',
          '<track id="1" name="" lang_code="en" lang_original="English (auto-generated)" kind="asr" />',
          "</transcript_list>",
        ].join(""),
      });
      return;
    }

    const tlang = parsed.searchParams.get("tlang");
    const lang = parsed.searchParams.get("lang") || "en";
    if (tlang === "he") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          wireMagic: "pb3",
          events: [
            {
              tStartMs: 0,
              dDurationMs: 3000,
              segs: [{ utf8: "שלום, ברוכים הבאים לשיעור." }],
            },
            {
              tStartMs: 3200,
              dDurationMs: 3000,
              segs: [{ utf8: "התרגום האוטומטי פועל כראוי." }],
            },
          ],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        wireMagic: "pb3",
        events: [
          {
            tStartMs: 0,
            dDurationMs: 3000,
            segs: [{ utf8: `Hello (${lang}), welcome to the lesson.` }],
          },
          {
            tStartMs: 3200,
            dDurationMs: 3000,
            segs: [{ utf8: "Default API captions loaded cleanly." }],
          },
        ],
      }),
    });
  });

  // Mock YouTube iframe API so headless browser doesn't hang on third-party scripts
  await page.route("**/youtube.com/iframe_api*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.YT = window.YT || { Player: function() { return { loadModule: function(){}, setOption: function(){}, getCurrentTime: function(){return 0;}, getDuration: function(){return 120;}, getPlayerState: function(){return 2;}, getVideoData: function(){return {title:'Demo Video'};}, destroy: function(){} }; } };",
    });
  });

  // Ensure Advanced mode & clean metadata cache so timedtext?type=list runs cleanly
  await page.addInitScript(`(() => {
    if (!window.sessionStorage.getItem("__e2e_mode_init")) {
      window.localStorage.setItem("app_workflow_mode", "expert");
      window.localStorage.removeItem("yt_video_metadata_L2Ryrr6txwA");
      window.sessionStorage.setItem("__e2e_mode_init", "1");
    }
  })();`);

  await page.goto(`${APP_URL}/?v=L2Ryrr6txwA&target_lang=he`, { waitUntil: "domcontentloaded" });

  // 3A. Use Quick Loader drawer to fetch YouTube timedtext default (lang=en) + auto-translation (tlang=he) URLs
  const quickToggle = page.getByTestId("quick-loader-button header-quick-loader-button");
  if ((await quickToggle.count()) > 0) {
    const drawerAlreadyVisible = await page
      .getByTestId("toggle-web-demo-subtitles-drawer")
      .isVisible()
      .catch(() => false);
    if (!drawerAlreadyVisible) {
      await quickToggle.click();
      await page.waitForTimeout(200);
    }
  }
  await page.getByTestId("toggle-web-demo-subtitles-drawer").click();
  const webDemoUrlsInput = page.locator('[data-testid="web-demo-subtitles-urls-input"]').first();
  await webDemoUrlsInput.waitFor({ state: "visible", timeout: 10000 });
  await webDemoUrlsInput.fill(
    [
      "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3",
      "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&tlang=he&fmt=json3",
    ].join("\n"),
  );
  await page.getByTestId("fetch-web-demo-subtitles-button").click();
  await page.waitForTimeout(500);

  // 3B. Open Stage 3 (Video Player) and inspect #switchable-default-subtitles-bar
  await page.locator('[data-testid="stage-step-3"]').click();
  const bar = page.locator("#switchable-default-subtitles-bar").first();
  await bar.waitFor({ state: "visible", timeout: 15000 });

  const apiContainer = bar.locator(
    '[data-testid="youtube-api-default-auto-translations-container"]',
  );
  await apiContainer.waitFor({ state: "visible", timeout: 15000 });

  // Trigger Refresh API tracks if default button isn't already populated
  const defaultEnBtn = apiContainer.locator('[data-testid="youtube-api-track-btn-en-default"]');
  if ((await defaultEnBtn.count()) === 0) {
    const refreshBtn = apiContainer.locator('[data-testid="refresh-youtube-api-tracks-btn"]');
    if ((await refreshBtn.count()) > 0) {
      await refreshBtn.click();
    }
  }
  await defaultEnBtn.waitFor({ state: "visible", timeout: 10000 });

  const asrEnBtn = apiContainer.locator('[data-testid="youtube-api-track-btn-en-asr"]');
  await asrEnBtn.waitFor({ state: "visible", timeout: 10000 });

  const autoTransHeBtn = apiContainer.locator(
    '[data-testid="youtube-api-track-btn-he-auto-translation"]',
  );
  await autoTransHeBtn.waitFor({ state: "visible", timeout: 10000 });

  // Switch to English Default inside the new container
  await defaultEnBtn.click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="youtube-api-default-auto-translations-container"]')
        ?.getAttribute("data-active-api-track-id") === "default:en",
    undefined,
    { timeout: 10000 },
  );
  assert.strictEqual(await defaultEnBtn.getAttribute("aria-pressed"), "true");

  // Switch to Hebrew Auto-Translation via the new container
  await autoTransHeBtn.click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="youtube-api-default-auto-translations-container"]')
        ?.getAttribute("data-active-api-track-id") === "auto-translation:he",
    undefined,
    { timeout: 10000 },
  );
  assert.strictEqual(await autoTransHeBtn.getAttribute("aria-pressed"), "true");

  // 3C. Switch to Beginner Mode via ?mode=beginner & confirm parity inside Beginner Video tab
  await page.goto(`${APP_URL}/?v=L2Ryrr6txwA&target_lang=he&mode=beginner`, {
    waitUntil: "domcontentloaded",
  });

  const beginnerVideoTabBtn = page.locator('[data-testid="beginner-tab-video"]').first();
  if ((await beginnerVideoTabBtn.count()) > 0) {
    await beginnerVideoTabBtn.click();
  }

  const beginnerContainer = page
    .locator(
      '#switchable-default-subtitles-bar [data-testid="youtube-api-default-auto-translations-container"]',
    )
    .first();
  await beginnerContainer.waitFor({ state: "visible", timeout: 15000 });
  const beginnerDefaultEnBtn = beginnerContainer.locator(
    '[data-testid="youtube-api-track-btn-en-default"]',
  );
  const beginnerAsrEnBtn = beginnerContainer.locator(
    '[data-testid="youtube-api-track-btn-en-asr"]',
  );
  await beginnerDefaultEnBtn.waitFor({ state: "visible", timeout: 10000 });
  await beginnerAsrEnBtn.waitFor({ state: "visible", timeout: 10000 });

  // Switch between Default and Auto (ASR) inside Beginner Mode
  await beginnerAsrEnBtn.click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="youtube-api-default-auto-translations-container"]')
        ?.getAttribute("data-active-api-track-id") === "asr:en",
    undefined,
    { timeout: 10000 },
  );
  await beginnerDefaultEnBtn.click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="youtube-api-default-auto-translations-container"]')
        ?.getAttribute("data-active-api-track-id") === "default:en",
    undefined,
    { timeout: 10000 },
  );

  // Confirm FloatingErrorButton is zero and no page/console errors occurred
  const errBtnCount = await page.locator('[data-testid="floating-error-button"]').count();
  assert.strictEqual(errBtnCount, 0, "FloatingErrorButton must not appear");
  assert.strictEqual(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join("; ")}`);
  assert.strictEqual(
    consoleErrors.length,
    0,
    `Unexpected console errors: ${consoleErrors.join("; ")}`,
  );
  assert.ok(
    interceptedUrls.some((u) => u.includes("type=list")) &&
      interceptedUrls.some((u) => u.includes("tlang=he")),
    "Playwright must have observed both YouTube timedtext?type=list and tlang=he API requests",
  );

  await browser.close();
  console.log(
    `✓ Live Chromium E2E passed (Advanced Stage 3 + Beginner Mode parity verified; intercepted ${interceptedUrls.length} timedtext API requests)`,
  );
}

runLiveE2E()
  .then(() => {
    console.log("=== ALL verify-youtube-api-default-auto-translations-switcher CHECKS PASSED ===");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  });
