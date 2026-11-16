import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

async function runSourceChecks() {
  const root = process.cwd();
  const indexContent = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf-8");
  const beginnerFlowContent = fs.readFileSync(
    path.join(root, "src/components/beginner/BeginnerFlowContainer.tsx"),
    "utf-8",
  );

  assert.match(
    indexContent,
    /if\s*\((?:currentAccordionStage\s*!==\s*3\s*&&\s*)?panelId\s*===\s*"player"\)\s*\{\s*return\s+true;\s*\}/,
    "src/routes/index.tsx must keep player panel mounted across stages",
  );
  assert.ok(
    indexContent.includes('data-player-stage-hidden={isPlayerHiddenForStage ? "true" : undefined}'),
    "src/routes/index.tsx must hide player offscreen without unmounting on non-3/5 stages",
  );
  assert.ok(
    indexContent.includes(
      'data-viewer-background-kept={activeTopTab !== "viewer" ? "true" : "false"}',
    ),
    "src/routes/index.tsx must keep viewer subtree mounted when top tab switches to Playground or AI Punctuation",
  );
  assert.ok(
    beginnerFlowContent.includes(
      'data-beginner-tab-hidden={activeTab !== "video" ? "true" : "false"}',
    ),
    "BeginnerFlowContainer.tsx must hide BeginnerVideoTab offscreen instead of display:none",
  );

  // Top tab buttons must not call pauseVideo
  const playgroundIdx = indexContent.indexOf('id="tab-playground"');
  const aiPunctIdx = indexContent.indexOf('id="tab-ai-punctuation"');
  assert.ok(playgroundIdx > -1 && aiPunctIdx > -1, "Top tab buttons must exist");
  const topTabsSlice = indexContent.slice(playgroundIdx, aiPunctIdx + 900);
  assert.ok(
    !topTabsSlice.includes("pauseVideo"),
    "Top tab onClick handlers must not pause the video player",
  );

  console.log("✅ PASS: Source checks for persistent player across tab/stage switches verified.");
}

async function runLiveE2E() {
  const knownHeadlessPath =
    "/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell";
  const executablePath = fs.existsSync(knownHeadlessPath) ? knownHeadlessPath : undefined;
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  // Intercept YouTube IFrame API with an observable stateful test player
  await page.route("**/*youtube.com/iframe_api*", async (route) => {
    const mockScript = `
      (function () {
        if (window.__ytTestHarness) return;
        const harness = {
          initCount: 0,
          destroyCount: 0,
          pauseCalls: 0,
          playCalls: 0,
          state: -1,
          currentTime: 0,
          lastTick: Date.now(),
        };
        window.__ytTestHarness = harness;
        setInterval(function () {
          const now = Date.now();
          if (harness.state === 1) {
            harness.currentTime += (now - harness.lastTick) / 1000;
          }
          harness.lastTick = now;
        }, 50);

        window.YT = {
          PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 },
          Player: function (el, config) {
            harness.initCount += 1;
            const host = typeof el === "string" ? document.getElementById(el) : el;
            const iframe = document.createElement("iframe");
            iframe.setAttribute("data-testid", "mock-youtube-iframe");
            iframe.src = "about:blank";
            if (host) {
              host.innerHTML = "";
              host.appendChild(iframe);
            }
            const instance = {
              playVideo: function () {
                harness.playCalls += 1;
                harness.state = 1;
                harness.lastTick = Date.now();
                config && config.events && config.events.onStateChange && config.events.onStateChange({ data: 1 });
              },
              pauseVideo: function () {
                harness.pauseCalls += 1;
                harness.state = 2;
                config && config.events && config.events.onStateChange && config.events.onStateChange({ data: 2 });
              },
              stopVideo: function () {
                harness.pauseCalls += 1;
                harness.state = 0;
                config && config.events && config.events.onStateChange && config.events.onStateChange({ data: 0 });
              },
              seekTo: function (sec) {
                harness.currentTime = Number(sec) || 0;
              },
              getCurrentTime: function () {
                return harness.currentTime;
              },
              getDuration: function () {
                return 180;
              },
              getPlaybackRate: function () {
                return 1;
              },
              setPlaybackRate: function () {},
              getPlayerState: function () {
                return harness.state;
              },
              getVideoData: function () {
                return { video_id: config && config.videoId || "L2Ryrr6txwA", title: "Test Video", author: "Test" };
              },
              getIframe: function () {
                return iframe;
              },
              mute: function () {},
              unMute: function () {},
              isMuted: function () { return false; },
              getOption: function () { return {}; },
              loadVideoById: function () {},
              destroy: function () {
                harness.destroyCount += 1;
                if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
              },
            };
            setTimeout(function () {
              if (config && config.events && config.events.onReady) {
                config.events.onReady({ target: instance });
              }
            }, 30);
            return instance;
          }
        };
        if (typeof window.onYouTubeIframeAPIReady === "function") {
          window.onYouTubeIframeAPIReady();
        }
      })();
    `;
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: mockScript,
    });
  });

  // 1. Advanced Mode: Stage & Top-Tab Transitions
  console.log("1. Testing Advanced Mode stage & top-tab switches...");
  await page.goto(`${BASE_URL}/?mode=expert&debug=true&stage=3`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="mock-youtube-iframe"]', { timeout: 15000 });

  // Turn off automatic TTS-play pauses so any pauseCall during tab transitions isolates tab bugs
  await page.getByTestId("floating-menu-toggle-btn").click();
  await page.getByTestId("menu-option-tts-play").click();
  await page.getByRole("button", { name: "Close floating menu" }).click();

  // Start playback
  await page.getByTestId("video-overlay-play-pause-btn").click();
  await page.waitForFunction(
    () =>
      (window as unknown as { __ytTestHarness?: { state: number } }).__ytTestHarness?.state === 1,
  );

  const beforeTime = await page.evaluate(
    () =>
      (window as unknown as { __ytTestHarness: { currentTime: number } }).__ytTestHarness
        .currentTime,
  );

  // Switch across Stage 1, Stage 2, Stage 4, Stage 6, and back to Stage 3
  for (const stageId of ["stage-step-1", "stage-step-2", "stage-step-4", "stage-step-history"]) {
    await page.getByTestId(stageId).click();
    await page.waitForTimeout(150);
    const snap = await page.evaluate(
      () =>
        (
          window as unknown as {
            __ytTestHarness: {
              state: number;
              destroyCount: number;
              pauseCalls: number;
              initCount: number;
            };
          }
        ).__ytTestHarness,
    );
    assert.strictEqual(
      snap.destroyCount,
      0,
      `Player must NOT be destroyed when switching to ${stageId}`,
    );
    assert.strictEqual(
      snap.pauseCalls,
      0,
      `Player must NOT be paused when switching to ${stageId}`,
    );
    assert.strictEqual(snap.initCount, 1, `Player must NOT re-init when switching to ${stageId}`);
    assert.strictEqual(snap.state, 1, `Player must stay PLAYING (state=1) on ${stageId}`);
    const playerContainerVisible = await page
      .getByTestId("video-player-fullscreen-container")
      .isVisible();
    assert.strictEqual(playerContainerVisible, false, `Player UI must stay hidden on ${stageId}`);
  }

  // Switch Top Tabs (Playground & AI Punctuation) and back to viewer
  await page.getByTestId("tab-playground").click();
  await page.waitForTimeout(150);
  let snap = await page.evaluate(
    () =>
      (
        window as unknown as {
          __ytTestHarness: {
            state: number;
            destroyCount: number;
            pauseCalls: number;
            initCount: number;
          };
        }
      ).__ytTestHarness,
  );
  assert.strictEqual(snap.destroyCount, 0, "Player must NOT be destroyed on tab-playground");
  assert.strictEqual(snap.pauseCalls, 0, "Player must NOT be paused on tab-playground");
  assert.strictEqual(snap.state, 1, "Player must stay PLAYING on tab-playground");

  await page.getByTestId("tab-ai-punctuation").click();
  await page.waitForTimeout(150);
  snap = await page.evaluate(
    () =>
      (
        window as unknown as {
          __ytTestHarness: {
            state: number;
            destroyCount: number;
            pauseCalls: number;
            initCount: number;
          };
        }
      ).__ytTestHarness,
  );
  assert.strictEqual(snap.destroyCount, 0, "Player must NOT be destroyed on tab-ai-punctuation");
  assert.strictEqual(snap.pauseCalls, 0, "Player must NOT be paused on tab-ai-punctuation");
  assert.strictEqual(snap.state, 1, "Player must stay PLAYING on tab-ai-punctuation");

  // Return to viewer + Stage 3
  await page.getByTestId("tab-ai-punctuation").click();
  await page.getByTestId("stage-step-3").click();
  await page.waitForTimeout(150);
  const afterTime = await page.evaluate(
    () =>
      (
        window as unknown as {
          __ytTestHarness: { currentTime: number; state: number; initCount: number };
        }
      ).__ytTestHarness,
  );
  assert.strictEqual(afterTime.state, 1, "Player must still be playing upon return to Stage 3");
  assert.strictEqual(afterTime.initCount, 1, "Player must never have been recreated");
  assert.ok(
    afterTime.currentTime > beforeTime,
    `Playback time must have progressed across tab changes (${beforeTime} -> ${afterTime.currentTime})`,
  );
  console.log("✅ PASS: Advanced Mode stage & top-tab switches keep video playing uninterrupted.");

  // 2. Beginner Mode: Video <-> Preferences Tab Transitions
  console.log("2. Testing Beginner Mode Video <-> Preferences tab switches...");
  await page.goto(`${BASE_URL}/?mode=beginner`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("beginner-tab-video").click();
  await page.waitForSelector('[data-testid="mock-youtube-iframe"]', { timeout: 15000 });
  await page.getByTestId("video-overlay-play-pause-btn").click();
  await page.waitForFunction(
    () =>
      (window as unknown as { __ytTestHarness?: { state: number } }).__ytTestHarness?.state === 1,
  );

  await page.getByTestId("beginner-tab-preferences").click();
  await page.waitForTimeout(200);
  const begPrefSnap = await page.evaluate(
    () =>
      (
        window as unknown as {
          __ytTestHarness: {
            state: number;
            destroyCount: number;
            pauseCalls: number;
            initCount: number;
          };
        }
      ).__ytTestHarness,
  );
  assert.strictEqual(
    begPrefSnap.destroyCount,
    0,
    "Beginner player must NOT destroy on Preferences tab",
  );
  assert.strictEqual(
    begPrefSnap.pauseCalls,
    0,
    "Beginner player must NOT pause on Preferences tab",
  );
  assert.strictEqual(
    begPrefSnap.initCount,
    1,
    "Beginner player must NOT re-init on Preferences tab",
  );
  assert.strictEqual(begPrefSnap.state, 1, "Beginner player must stay PLAYING on Preferences tab");
  const begVideoVisible = await page.getByTestId("beginner-video-tab").isVisible();
  assert.strictEqual(
    begVideoVisible,
    false,
    "beginner-video-tab must be hidden when Preferences tab is active",
  );

  await page.getByTestId("beginner-tab-video").click();
  await page.waitForTimeout(150);
  const begBackVisible = await page.getByTestId("beginner-video-tab").isVisible();
  assert.strictEqual(
    begBackVisible,
    true,
    "beginner-video-tab must be visible again when switching back",
  );
  console.log("✅ PASS: Beginner Mode tab switches keep video playing uninterrupted.");

  const errBtnCount = await page.locator('[data-testid="floating-error-button"]').count();
  assert.strictEqual(errBtnCount, 0, "Zero floating error buttons expected");
  assert.deepStrictEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("; ")}`);

  await browser.close();
}

async function main() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Task 425: Changing Tabs Keeps Video Player Playing");
  console.log("=========================================================================");
  await runSourceChecks();
  await runLiveE2E();
  console.log("🎉 ALL TASK 425 TAB-CHANGE VIDEO PLAYBACK TESTS PASSED!");
}

main().catch((err) => {
  console.error("❌ FAIL:", err);
  process.exit(1);
});
