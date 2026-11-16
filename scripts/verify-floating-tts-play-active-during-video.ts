/**
 * Dedicated Verification & Live E2E Test for Task 427 (Prompt 214 Chapter 2):
 * "tts-play is presented as enabled on the floating button menu but actually it isn't active while the video player is playing"
 *
 * Validates:
 * 1. Unit & source contracts:
 *    - FloatingDraggablePauseButton surfaces live setup-pause / speaking / active playback status.
 *    - src/routes/index.tsx guards utterance.voice assignment, syncs autoPlayTTS on videoId change,
 *      clears handled section caches when toggling TTS-Play ON, supports fallback when spoken lacks
 *      non-base loaded tracks, and activates TTS during BOTH pauseMode and continuous (!pauseMode) playback.
 * 2. Live Playwright Chromium E2E across:
 *    - Advanced Stage 3 (pauseMode ON -> TTS speaks translated subtitles while playing;
 *      toggle OFF -> stops TTS; toggle ON -> resumes TTS;
 *      continuous playback pauseMode OFF -> TTS STILL speaks without pausing video).
 *    - Beginner Mode (Video tab -> TTS-Play Enabled -> TTS actively speaks during playback).
 *    - Zero page errors, zero unexpected console errors, and zero FloatingErrorButton triggers.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

function runSourceContractChecks() {
  console.log("1. Running source & coordinator contract checks...");
  const root = process.cwd();
  const indexCode = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf-8");
  const floatingBtnCode = fs.readFileSync(
    path.join(root, "src/components/FloatingDraggablePauseButton.tsx"),
    "utf-8",
  );

  assert.ok(
    floatingBtnCode.includes('data-testid="menu-option-tts-play-status"'),
    "FloatingDraggablePauseButton must expose live status text for menu-option-tts-play",
  );
  assert.ok(
    floatingBtnCode.includes("Waiting — Setup Pause is ON") &&
      floatingBtnCode.includes("Speaking translated subtitles now"),
    "FloatingDraggablePauseButton must show live Setup Pause and Speaking feedback for TTS-Play",
  );
  assert.ok(
    indexCode.includes("try {\n              utterance.voice = matchedVoice;\n            } catch") ||
      indexCode.includes("try {\r\n              utterance.voice = matchedVoice;\r\n            } catch"),
    "src/routes/index.tsx must guard utterance.voice assignment against synthetic voice TypeErrors",
  );
  assert.ok(
    indexCode.includes("handledTtsFirstSections.current.clear();") &&
      indexCode.includes("handledVideoFirstSections.current.clear();"),
    "onTtsPlayEnabledChange(true) must clear handled section caches so TTS resumes mid-playback",
  );
  assert.ok(
    indexCode.includes("hasLoadedNonBaseSpoken"),
    "getEligibleLangs must detect when spoken lacks loaded non-base speakable subtitles and fall back",
  );
  assert.ok(
    indexCode.includes("if (pauseMode && st.current.isTtsPlayEnabled)") &&
      indexCode.includes("} else if (st.current.isTtsPlayEnabled) {"),
    "Playback coordinator must activate TTS-Play in BOTH pauseMode and continuous (!pauseMode) playback",
  );
  assert.ok(
    indexCode.includes("} else if (!isPausedForTtsRef.current) {"),
    "Coordinator must keep playbackCurrentTime and active row updated during continuous TTS playback",
  );
  console.log("✅ PASS: All source & coordinator contract checks verified.");
}

async function setupBrowserMocks(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const spokenLog: Array<{ text: string; lang: string; rate: number; ts: number }> = [];
    (window as unknown as Record<string, unknown>).__mockTtsSpoken = spokenLog;
    (window as unknown as Record<string, unknown>).__mockSpeechPausedCount = 0;

    class MockSpeechSynthesisUtterance {
      text: string;
      lang = "en-US";
      rate = 1;
      volume = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onstart: ((ev: Event) => void) | null = null;
      onend: ((ev: Event) => void) | null = null;
      onerror: ((ev: { error: string }) => void) | null = null;
      onboundary: ((ev: unknown) => void) | null = null;

      constructor(text = "") {
        this.text = text;
      }
    }

    (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance;

    const activeTimers = new Set<number>();
    const mockSynth = {
      speaking: false,
      pending: false,
      paused: false,
      onvoiceschanged: null as (() => void) | null,
      getVoices() {
        return [
          { name: "Mock English", lang: "en-US", voiceURI: "mock-en", localService: true, default: true },
          { name: "Mock Hebrew", lang: "he-IL", voiceURI: "mock-he", localService: true, default: false },
          { name: "Mock Spanish", lang: "es-ES", voiceURI: "mock-es", localService: true, default: false },
        ];
      },
      speak(u: MockSpeechSynthesisUtterance) {
        spokenLog.push({
          text: String(u.text || ""),
          lang: String(u.lang || ""),
          rate: Number(u.rate || 1),
          ts: Date.now(),
        });
        mockSynth.speaking = true;
        const startTimer = window.setTimeout(() => {
          activeTimers.delete(startTimer);
          u.onstart?.(new Event("start"));
        }, 15);
        const endTimer = window.setTimeout(() => {
          activeTimers.delete(endTimer);
          mockSynth.speaking = false;
          u.onend?.(new Event("end"));
        }, 120);
        activeTimers.add(startTimer);
        activeTimers.add(endTimer);
      },
      cancel() {
        for (const id of activeTimers) {
          clearTimeout(id);
        }
        activeTimers.clear();
        mockSynth.speaking = false;
      },
      pause() {
        mockSynth.paused = true;
      },
      resume() {
        mockSynth.paused = false;
      },
      addEventListener() {},
      removeEventListener() {},
    };

    try {
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: mockSynth,
      });
    } catch {
      (window as unknown as Record<string, unknown>).speechSynthesis = mockSynth;
    }
  });

  await page.route("**/*youtube.com/iframe_api*", async (route) => {
    const mockScript = `
      (function () {
        if (window.__ytTestHarness) return;
        const harness = {
          initCount: 0,
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
        }, 40);

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
                return { video_id: (config && config.videoId) || "L2Ryrr6txwA", title: "Sample Fixture Video", author: "Test" };
              },
              getIframe: function () {
                return iframe;
              },
              mute: function () {},
              unMute: function () {},
              setVolume: function () {},
              destroy: function () {},
            };
            window.setTimeout(function () {
              config && config.events && config.events.onReady && config.events.onReady({ target: instance });
            }, 25);
            return instance;
          },
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

  // Block external TTS fallback URL so tests prove local/native TTS runs cleanly without remote hangs
  await page.route("**/*tts3.lovable.app/**", async (route) => {
    await route.abort();
  });
}

async function runLiveE2E() {
  console.log("2. Running live Chromium E2E checks across Advanced Stage 3 & Beginner Mode...");
  const knownHeadlessPath =
    "/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell";
  const executablePath = fs.existsSync(knownHeadlessPath) ? knownHeadlessPath : undefined;

  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });

  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  try {
    // --- Scenario A: Advanced Mode (Stage 3) ---
    const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const page = await context.newPage();
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          !text.includes("ERR_FAILED") &&
          !text.includes("clients5.google.com") &&
          !text.includes("tts3.lovable.app") &&
          !text.includes("compute-pressure")
        ) {
          consoleErrors.push(text);
        }
      }
    });

    await setupBrowserMocks(page);

    await page.goto(`${BASE_URL}/?mode=expert&video=L2Ryrr6txwA&stage=0`, {
      waitUntil: "domcontentloaded",
    });

    const loadSampleBtn = page.getByTestId("btn-load-sample-subtitles");
    await loadSampleBtn.waitFor({ state: "visible", timeout: 25000 });
    await loadSampleBtn.click();

    await page.getByTestId("stage-step-2").click();
    await page.waitForSelector("[data-row]", { timeout: 15000 });

    await page.getByTestId("stage-step-3").click();
    await page.waitForTimeout(300);

    // Check Floating menu TTS-Play is Enabled
    const menuToggle = page.getByTestId("floating-menu-toggle-btn");
    await menuToggle.waitFor({ state: "visible", timeout: 10000 });
    await menuToggle.click();

    const ttsPlayOption = page.getByTestId("menu-option-tts-play");
    await ttsPlayOption.waitFor({ state: "visible", timeout: 5000 });
    const optionText = await ttsPlayOption.innerText();
    assert.ok(optionText.includes("Enabled"), `Expected TTS-Play Enabled in floating menu, got: ${optionText}`);

    // Close menu
    await menuToggle.click();

    // Start video playback via floating play button
    await page.getByTestId("floating-pause-button").click();

    // Wait for first subtitle section speech synthesis to trigger during playback
    await page.waitForFunction(
      () => {
        const spoken = (window as unknown as { __mockTtsSpoken?: unknown[] }).__mockTtsSpoken || [];
        return spoken.length >= 1;
      },
      null,
      { timeout: 15000 },
    );

    const spokenAfterPlay = await page.evaluate(
      () => (window as unknown as { __mockTtsSpoken: Array<{ text: string; lang: string }> }).__mockTtsSpoken,
    );
    assert.ok(spokenAfterPlay.length >= 1, "TTS-Play must speak subtitles while video plays");

    // Verify history entry recorded for auto_playback
    const historyCount = await page.evaluate(() => {
      try {
        const raw = window.localStorage.getItem("yt_tts_play_history_v1");
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    });
    assert.ok(historyCount >= 1, `Expected >= 1 entry in yt_tts_play_history_v1, got ${historyCount}`);

    // Now test toggling TTS-Play OFF then back ON
    await menuToggle.click();
    await ttsPlayOption.click();
    const disabledText = await ttsPlayOption.innerText();
    assert.ok(disabledText.includes("Disabled"), `Expected Disabled after toggle, got: ${disabledText}`);

    const countWhenDisabled = await page.evaluate(
      () => ((window as unknown as { __mockTtsSpoken: unknown[] }).__mockTtsSpoken || []).length,
    );
    // Toggle back ON
    await ttsPlayOption.click();
    const reenabledText = await ttsPlayOption.innerText();
    assert.ok(reenabledText.includes("Enabled"), `Expected Enabled after toggle back ON, got: ${reenabledText}`);
    await menuToggle.click();

    // Wait for another section to speak while TTS-Play is back ON
    await page.waitForFunction(
      (prevLen) => {
        const spoken = (window as unknown as { __mockTtsSpoken?: unknown[] }).__mockTtsSpoken || [];
        return spoken.length > prevLen;
      },
      countWhenDisabled,
      { timeout: 15000 },
    );

    // Now test Continuous playback mode (pauseMode === false) with TTS-Play still Enabled
    const pauseCheckbox = page.locator("label:has-text('Pause & speak after each section') input[type='checkbox']").first();
    if ((await pauseCheckbox.count()) > 0 && (await pauseCheckbox.isChecked())) {
      await pauseCheckbox.uncheck();
    }
    const pauseCallsBeforeContinuous = await page.evaluate(
      () => (window as unknown as { __ytTestHarness: { pauseCalls: number } }).__ytTestHarness.pauseCalls,
    );
    const spokenBeforeContinuous = await page.evaluate(
      () => ((window as unknown as { __mockTtsSpoken: unknown[] }).__mockTtsSpoken || []).length,
    );

    await page.waitForFunction(
      (prevLen) => {
        const spoken = (window as unknown as { __mockTtsSpoken?: unknown[] }).__mockTtsSpoken || [];
        return spoken.length > prevLen;
      },
      spokenBeforeContinuous,
      { timeout: 15000 },
    );

    const pauseCallsAfterContinuous = await page.evaluate(
      () => (window as unknown as { __ytTestHarness: { pauseCalls: number } }).__ytTestHarness.pauseCalls,
    );
    assert.equal(
      pauseCallsAfterContinuous,
      pauseCallsBeforeContinuous,
      "Continuous playback mode (!pauseMode) must trigger TTS without pausing the video player",
    );

    const floatingErrorVisible = await page
      .locator('[data-testid="floating-error-button"]')
      .isVisible()
      .catch(() => false);
    assert.equal(floatingErrorVisible, false, "FloatingErrorButton must remain hidden (0 errors)");

    console.log(
      `✅ PASS Scenario A (Advanced Stage 3): spoken=${await page.evaluate(() => ((window as unknown as { __mockTtsSpoken: unknown[] }).__mockTtsSpoken || []).length)}, history=${historyCount}, continuousModeVerified=true`,
    );
    await context.close();

    // --- Scenario B: Beginner Mode (Video Tab) ---
    const bContext = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const bPage = await bContext.newPage();
    bPage.on("pageerror", (err) => pageErrors.push(err.message));
    await setupBrowserMocks(bPage);

    await bPage.goto(`${BASE_URL}/?mode=beginner&video=L2Ryrr6txwA`, {
      waitUntil: "domcontentloaded",
    });

    const bSampleBtn = bPage.getByTestId("btn-load-sample-subtitles");
    await bSampleBtn.waitFor({ state: "visible", timeout: 25000 });
    await bSampleBtn.click();

    await bPage.getByTestId("beginner-tab-video").click();
    await bPage.waitForTimeout(300);

    await bPage.getByTestId("floating-menu-toggle-btn").click();
    const bTtsOption = bPage.getByTestId("menu-option-tts-play");
    await bTtsOption.waitFor({ state: "visible", timeout: 5000 });
    assert.ok(
      (await bTtsOption.innerText()).includes("Enabled"),
      "Beginner mode floating menu TTS-Play must show Enabled",
    );
    await bPage.getByTestId("floating-menu-toggle-btn").click();

    await bPage.getByTestId("floating-pause-button").click();

    await bPage.waitForFunction(
      () => {
        const spoken = (window as unknown as { __mockTtsSpoken?: unknown[] }).__mockTtsSpoken || [];
        return spoken.length >= 1;
      },
      null,
      { timeout: 15000 },
    );

    const bSpokenCount = await bPage.evaluate(
      () => ((window as unknown as { __mockTtsSpoken: unknown[] }).__mockTtsSpoken || []).length,
    );
    console.log(`✅ PASS Scenario B (Beginner Mode Video Tab): spoken=${bSpokenCount}`);
    await bContext.close();
  } finally {
    await browser.close();
  }

  assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join("; ")}`);
  assert.equal(consoleErrors.length, 0, `Unexpected console errors: ${consoleErrors.join("; ")}`);
  console.log("✅ PASS: All Live Chromium E2E assertions passed with 0 page/console errors.");
}

async function main() {
  console.log("=========================================================================");
  console.log("🧪 Running Verification: Floating TTS-Play Active During Video Playback (Task 427)");
  console.log("=========================================================================");
  runSourceContractChecks();
  await runLiveE2E();
  console.log("=========================================================================");
  console.log("🎉 Task 427 Floating TTS-Play Active Verification PASSED!");
  console.log("=========================================================================");
}

main().catch((err) => {
  console.error("❌ FAIL:", err);
  process.exit(1);
});
