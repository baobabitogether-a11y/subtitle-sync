import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  detectManualProgressBarSeek,
  findRowIndexAtTimeMs,
  getEffectivePlayerTimeSec,
  isAwaitingPendingSeek,
  shouldAbortQueuedSectionResume,
} from "../src/lib/playback-seek-coordinator";

console.log("=========================================================================");
console.log("🧪 Verifying Task 420: Progress Bar Seek Overrides TTS/Video Queue");
console.log("=========================================================================");

// --- 1. Unit tests for playback-seek-coordinator.ts ---
const sampleRows = [
  { start: 0, end: 4000 },
  { start: 4000, end: 8000 },
  { start: 10000, end: 15000 },
  { start: 20000, end: 26000 },
  { start: 40000, end: 46000 },
];

assert.strictEqual(findRowIndexAtTimeMs(sampleRows, 0), 0);
assert.strictEqual(findRowIndexAtTimeMs(sampleRows, 3999), 0);
assert.strictEqual(findRowIndexAtTimeMs(sampleRows, 4000), 1);
assert.strictEqual(findRowIndexAtTimeMs(sampleRows, 9000), -1, "Gap returns -1");
assert.strictEqual(findRowIndexAtTimeMs(sampleRows, 42000), 4);
console.log("✅ PASS: findRowIndexAtTimeMs handles cues and gaps accurately.");

// Pending seek grace guard
const now = 100_000;
assert.strictEqual(
  isAwaitingPendingSeek(3.2, { targetSec: 42.0, requestedAt: now - 200 }, now),
  true,
  "Stale pre-seek player position within grace period must be awaited",
);
assert.strictEqual(
  isAwaitingPendingSeek(41.8, { targetSec: 42.0, requestedAt: now - 200 }, now),
  false,
  "Once player arrives near targetSec, pending seek settles immediately",
);
assert.strictEqual(
  isAwaitingPendingSeek(3.2, { targetSec: 42.0, requestedAt: now - 1300 }, now),
  false,
  "Pending seek expires after graceMs timeout",
);
assert.strictEqual(
  getEffectivePlayerTimeSec(3.2, { targetSec: 42.0, requestedAt: now - 150 }, now),
  42.0,
  "Rapid consecutive seeks read pending targetSec instead of stale pre-seek time",
);
console.log("✅ PASS: Pending seek guard prevents stale getCurrentTime() bounce-back.");

// Manual progress bar seek detection
assert.strictEqual(
  detectManualProgressBarSeek({
    ms: 4200,
    lastMs: 4050,
    wallElapsedMs: 150,
    playbackRate: 1.0,
    isBusyForTts: false,
    isAudioTrackMode: false,
  }),
  false,
  "Normal 150ms playback advance must NOT be flagged as manual seek",
);
assert.strictEqual(
  detectManualProgressBarSeek({
    ms: 42000,
    lastMs: 4050,
    wallElapsedMs: 150,
    playbackRate: 1.0,
    isBusyForTts: false,
    isAudioTrackMode: false,
  }),
  true,
  "Forward progress bar scrub during video playback must be detected",
);
assert.strictEqual(
  detectManualProgressBarSeek({
    ms: 1500,
    lastMs: 12000,
    wallElapsedMs: 150,
    playbackRate: 1.0,
    isBusyForTts: false,
    isAudioTrackMode: false,
  }),
  true,
  "Backward progress bar scrub during video playback must be detected",
);
assert.strictEqual(
  detectManualProgressBarSeek({
    ms: 42000,
    lastMs: 4200,
    wallElapsedMs: 150,
    playbackRate: 1.0,
    isBusyForTts: true,
    isAudioTrackMode: false,
  }),
  true,
  "Moving YouTube progress bar while TTS-play is active must be detected",
);
assert.strictEqual(
  detectManualProgressBarSeek({
    ms: 4300,
    lastMs: 4000,
    wallElapsedMs: 150,
    playbackRate: 1.0,
    isBusyForTts: true,
    isAudioTrackMode: false,
  }),
  false,
  "Minor post-pause player deceleration (<1500ms) during TTS-play must NOT cancel TTS",
);
assert.strictEqual(
  detectManualProgressBarSeek({
    ms: 12500,
    lastMs: 10200,
    wallElapsedMs: 150,
    playbackRate: 1.0,
    isBusyForTts: true,
    isAudioTrackMode: true,
    activeSpeakingRow: { start: 10000, end: 15000 },
  }),
  false,
  "In audioTrackMode, playback advancing inside activeSpeakingRow must NOT cancel TTS",
);
assert.strictEqual(
  detectManualProgressBarSeek({
    ms: 35000,
    lastMs: 12000,
    wallElapsedMs: 150,
    playbackRate: 1.0,
    isBusyForTts: true,
    isAudioTrackMode: true,
    activeSpeakingRow: { start: 10000, end: 15000 },
  }),
  true,
  "In audioTrackMode, scrubbing outside activeSpeakingRow must be detected",
);
console.log("✅ PASS: detectManualProgressBarSeek handles video playback, TTS-play, and audioTrackMode.");

assert.strictEqual(
  shouldAbortQueuedSectionResume({
    runEpoch: 1,
    currentEpoch: 2,
    wasCancelled: false,
    isSetupPaused: false,
    userExplicitlyPaused: false,
  }),
  true,
  "Superseded seek epoch must abort queued section resume even if another section started",
);
console.log("✅ PASS: shouldAbortQueuedSectionResume guards against superseded TTS section completion.");

// --- 2. Source-level integration contracts ---
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf8");

assert.ok(
  indexContent.includes("playbackSeekEpochRef.current += 1;") &&
    indexContent.includes("pendingSeekTargetRef.current"),
  "src/routes/index.tsx must maintain playbackSeekEpochRef and pendingSeekTargetRef",
);
assert.ok(
  indexContent.includes("detectManualProgressBarSeek(") &&
    indexContent.includes("isAwaitingPendingSeek("),
  "src/routes/index.tsx polling loop must use detectManualProgressBarSeek and isAwaitingPendingSeek",
);
assert.ok(
  indexContent.includes("onSeek={handleSeek}") &&
    indexContent.includes("onRewind={handleRewind}") &&
    indexContent.includes("onFastForward={handleFastForward}") &&
    indexContent.includes("onStop={handleStop}"),
  "Both Advanced and Beginner VideoPlaybackControls must share handleSeek/handleRewind/handleFastForward/handleStop",
);
console.log("✅ PASS: Source integration contracts verified.");

// --- 3. Live Playwright Chromium E2E test ---
const APP_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

async function runLiveBrowserCheck() {
  const knownHeadlessPath =
    "/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell";
  const executablePath = fs.existsSync(knownHeadlessPath) ? knownHeadlessPath : undefined;

  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const pageErrors: string[] = [];
  page.on("pageerror", (err) => {
    console.error("[PAGEERROR]", err.message, "\n", err.stack);
    pageErrors.push(err.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("[CONSOLE_ERROR]", msg.text());
    }
  });

  // Inject controllable YT Player + slow mock speechSynthesis as raw JS string (avoids tsx helper injection in browser)
  await page.addInitScript(`(() => {
    window.localStorage.setItem("app_workflow_mode", "expert");

    var activeTimers = new Set();
    var synthSpeaking = false;
    window.__ttsSpeakCount = 0;
    window.__ttsCancelCount = 0;
    window.__spokenTexts = [];

    var mockSynth = {
      speaking: false,
      paused: false,
      pending: false,
      getVoices: function () {
        return [
          { name: "Mock English", lang: "en-US", voiceURI: "mock-en", localService: true, default: true },
          { name: "Mock Hebrew", lang: "he-IL", voiceURI: "mock-he", localService: true, default: false },
          { name: "Mock Spanish", lang: "es-ES", voiceURI: "mock-es", localService: true, default: false },
        ];
      },
      speak: function (utterance) {
        window.__ttsSpeakCount = Number(window.__ttsSpeakCount || 0) + 1;
        window.__spokenTexts.push(String((utterance && utterance.text) || ""));
        synthSpeaking = true;
        mockSynth.speaking = true;
        if (utterance && utterance.onstart) utterance.onstart();
        var tid = window.setTimeout(function () {
          activeTimers.delete(tid);
          synthSpeaking = false;
          mockSynth.speaking = false;
          if (utterance && utterance.onend) utterance.onend();
        }, 1200);
        activeTimers.add(tid);
      },
      cancel: function () {
        if (synthSpeaking || activeTimers.size > 0) {
          window.__ttsCancelCount = Number(window.__ttsCancelCount || 0) + 1;
        }
        activeTimers.forEach(function (tid) {
          window.clearTimeout(tid);
        });
        activeTimers.clear();
        synthSpeaking = false;
        mockSynth.speaking = false;
      },
      pause: function () {},
      resume: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: mockSynth,
      configurable: true,
    });
    window.SpeechSynthesisUtterance = function (text) {
      this.text = text;
      this.lang = "en-US";
      this.rate = 1;
      this.volume = 1;
    };

    var state = {
      currentTime: 0,
      duration: 180,
      playerState: 2,
      playbackRate: 1,
      lastTickAt: Date.now(),
      seekHistory: [],
    };
    window.__mockYtState = state;

    function advanceTime() {
      var t = Date.now();
      if (state.playerState === 1) {
        state.currentTime = Math.min(
          state.duration,
          state.currentTime + ((t - state.lastTickAt) / 1000) * state.playbackRate,
        );
      }
      state.lastTickAt = t;
    }

    function MockYTPlayer(_el, opts) {
      this.onStateChange = opts && opts.events && opts.events.onStateChange;
      window.__mockYtPlayer = this;
      setTimeout(function () {
        if (opts && opts.events && opts.events.onReady) opts.events.onReady();
      }, 50);
    }
    MockYTPlayer.prototype.playVideo = function () {
      advanceTime();
      state.playerState = 1;
      state.lastTickAt = Date.now();
      if (this.onStateChange) this.onStateChange({ data: 1 });
    };
    MockYTPlayer.prototype.pauseVideo = function () {
      advanceTime();
      state.playerState = 2;
      state.lastTickAt = Date.now();
      if (this.onStateChange) this.onStateChange({ data: 2 });
    };
    MockYTPlayer.prototype.stopVideo = function () {
      state.playerState = 0;
      state.currentTime = 0;
    };
    MockYTPlayer.prototype.seekTo = function (sec) {
      state.currentTime = Math.max(0, Math.min(state.duration, sec));
      state.lastTickAt = Date.now();
      state.seekHistory.push(state.currentTime);
    };
    MockYTPlayer.prototype.getCurrentTime = function () {
      advanceTime();
      return state.currentTime;
    };
    MockYTPlayer.prototype.getDuration = function () {
      return state.duration;
    };
    MockYTPlayer.prototype.getPlayerState = function () {
      return state.playerState;
    };
    MockYTPlayer.prototype.getPlaybackRate = function () {
      return state.playbackRate;
    };
    MockYTPlayer.prototype.setPlaybackRate = function (r) {
      state.playbackRate = r;
    };
    MockYTPlayer.prototype.getVideoData = function () {
      return { title: "Seek Test Video" };
    };
    MockYTPlayer.prototype.getOption = function () {
      return undefined;
    };
    MockYTPlayer.prototype.setOption = function () {};
    MockYTPlayer.prototype.loadModule = function () {};
    MockYTPlayer.prototype.mute = function () {};
    MockYTPlayer.prototype.unMute = function () {};
    MockYTPlayer.prototype.isMuted = function () {
      return false;
    };
    MockYTPlayer.prototype.destroy = function () {};

    window.YT = { Player: MockYTPlayer };
  })();`);

  // Intercept YouTube iframe_api so external script doesn't overwrite our mock YT.Player
  await page.route("**/youtube.com/iframe_api*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "/* mocked youtube iframe_api */",
    });
  });

  await page.goto(`${APP_URL}/?v=L2Ryrr6txwA`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="stage-step-2"]', { timeout: 15000 });

  // Open Quick Loader drawer and explicitly load local fixtures for L2Ryrr6txwA
  const quickToggle = page.getByTestId("quick-loader-button header-quick-loader-button");
  if ((await quickToggle.count()) > 0) {
    const drawerAlreadyVisible = await page
      .getByTestId("toggle-web-demo-subtitles-drawer")
      .isVisible()
      .catch(() => false);
    if (!drawerAlreadyVisible) {
      await quickToggle.click();
      await page.waitForTimeout(250);
    }
  }
  await page.getByTestId("toggle-web-demo-subtitles-drawer").click();
  await page.waitForTimeout(200);
  await page.locator('button:has-text("Load Sample Fixtures")').click();
  await page.waitForTimeout(100);
  await page.getByTestId("fetch-web-demo-subtitles-button").click();
  await page.waitForTimeout(600);

  // Verify Stage 2 subtitle table has populated rows
  await page.getByTestId("stage-step-2").click();
  await page.waitForTimeout(300);
  const rowCount = await page.locator("[data-row]").count();
  assert.ok(rowCount > 0, `Expected loaded fixture subtitle rows in Stage 2 (got ${rowCount})`);
  console.log(`ℹ️ Loaded ${rowCount} subtitle rows from L2Ryrr6txwA fixture.`);

  // Open Stage 3 (Video & Playback)
  await page.getByTestId("stage-step-3").click();
  await page.waitForSelector('[data-testid="player-control-seekbar"]', { timeout: 15000 });
  await page.waitForTimeout(400);

  const seekbar = page.getByTestId("player-control-seekbar");
  await seekbar.scrollIntoViewIfNeeded();

  // --- Scenario A: While VIDEO PLAYBACK is on, move VideoPlaybackControls seekbar ---
  await page.evaluate(() => {
    const s = (window as unknown as { __mockYtState: { currentTime: number; seekHistory: number[] } }).__mockYtState;
    s.currentTime = 2.0;
    s.seekHistory = [];
  });
  await page.getByTestId("player-control-play-pause").click();
  await page.waitForTimeout(250);

  // Move seekbar to 45s while video is playing
  await seekbar.evaluate((el: HTMLInputElement) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(el, "45");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(900);

  const afterVideoSeek = await page.evaluate(() => {
    const s = (window as unknown as { __mockYtState: { currentTime: number; seekHistory: number[] } }).__mockYtState;
    return { currentTime: s.currentTime, seekHistory: [...s.seekHistory] };
  });
  assert.ok(
    afterVideoSeek.currentTime >= 44.0,
    `Video playback seek to 45s must NOT be overwritten back to next queued section (got ${afterVideoSeek.currentTime.toFixed(2)}s, history=${JSON.stringify(afterVideoSeek.seekHistory)})`,
  );
  console.log(`✅ PASS [Scenario A - Video Playback Seekbar]: Player stayed at ${afterVideoSeek.currentTime.toFixed(2)}s (no snap-back).`);

  // --- Scenario B: While VIDEO PLAYBACK is on, scrub YouTube native timeline directly ---
  await page.evaluate(() => {
    const p = (window as unknown as { __mockYtPlayer: { seekTo: (s: number) => void } }).__mockYtPlayer;
    const s = (window as unknown as { __mockYtState: { seekHistory: number[] } }).__mockYtState;
    s.seekHistory = [];
    p.seekTo(82);
  });
  await page.waitForTimeout(900);

  const afterNativeVideoSeek = await page.evaluate(() => {
    const s = (window as unknown as { __mockYtState: { currentTime: number; seekHistory: number[] } }).__mockYtState;
    return { currentTime: s.currentTime, seekHistory: [...s.seekHistory] };
  });
  assert.ok(
    afterNativeVideoSeek.currentTime >= 81.0,
    `Native YT progress bar scrub to 82s during video playback must NOT be overwritten (got ${afterNativeVideoSeek.currentTime.toFixed(2)}s, history=${JSON.stringify(afterNativeVideoSeek.seekHistory)})`,
  );
  console.log(`✅ PASS [Scenario B - Native YT Scrub During Video Playback]: Player stayed at ${afterNativeVideoSeek.currentTime.toFixed(2)}s.`);

  // --- Scenario C: While TTS-PLAY is active, move seekbar and confirm TTS completion doesn't overwrite ---
  await page.evaluate(() => {
    const p = (window as unknown as { __mockYtPlayer: { seekTo: (s: number) => void; playVideo: () => void } }).__mockYtPlayer;
    const s = (window as unknown as { __mockYtState: { seekHistory: number[] } }).__mockYtState;
    p.seekTo(1.0);
    s.seekHistory = [];
    p.playVideo();
  });
  await page.waitForTimeout(300);

  // Trigger boundary crossing across cue 0 -> cue 1 to enter active TTS-play (~1200ms utterance)
  await page.evaluate(() => {
    const p = (window as unknown as { __mockYtPlayer: { seekTo: (s: number) => void } }).__mockYtPlayer;
    // Advance gradually from 1s -> 6s (or set time directly without seek history reset)
    const s = (window as unknown as { __mockYtState: { currentTime: number } }).__mockYtState;
    s.currentTime = 4.2;
    void p;
  });
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    const s = (window as unknown as { __mockYtState: { currentTime: number } }).__mockYtState;
    s.currentTime = 7.5;
  });
  await page.waitForTimeout(300);

  const ttsStarted = await page.evaluate(() => {
    return {
      speakCount: (window as unknown as { __ttsSpeakCount: number }).__ttsSpeakCount,
      speechHint: Boolean(document.querySelector('[data-testid="player-control-speech-hint"]')),
      speakingNow: window.speechSynthesis.speaking,
    };
  });
  assert.ok(
    ttsStarted.speakCount > 0,
    `Expected TTS-play to start speaking at least one subtitle section before testing seek override (got ${JSON.stringify(ttsStarted)})`,
  );

  // Move the progress bar to 95s while TTS-play is mid-utterance
  await seekbar.evaluate((el: HTMLInputElement) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(el, "95");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Wait > 1400ms (longer than mock speechSynthesis 1200ms utterance duration) to verify completed/aborted section does not snap back!
  await page.waitForTimeout(1500);

  const afterTtsSeek = await page.evaluate(() => {
    const s = (window as unknown as { __mockYtState: { currentTime: number; seekHistory: number[] } }).__mockYtState;
    return {
      currentTime: s.currentTime,
      seekHistory: [...s.seekHistory],
      cancelCount: (window as unknown as { __ttsCancelCount: number }).__ttsCancelCount,
    };
  });
  assert.ok(
    afterTtsSeek.currentTime >= 94.0,
    `Moving progress bar to 95s during TTS-play (ttsStarted=${JSON.stringify(ttsStarted)}) must NOT be overwritten when section finishes (got ${afterTtsSeek.currentTime.toFixed(2)}s, history=${JSON.stringify(afterTtsSeek.seekHistory)})`,
  );
  console.log(
    `✅ PASS [Scenario C - TTS-Play Seekbar]: Player stayed at ${afterTtsSeek.currentTime.toFixed(2)}s (speakCount=${ttsStarted.speakCount}, cancelCount=${afterTtsSeek.cancelCount}).`,
  );

  // --- Scenario C2: While TTS-PLAY is active, scrub YouTube NATIVE timeline directly ---
  await page.evaluate(() => {
    const p = (window as unknown as { __mockYtPlayer: { seekTo: (s: number) => void; playVideo: () => void } }).__mockYtPlayer;
    const s = (window as unknown as { __mockYtState: { seekHistory: number[] } }).__mockYtState;
    p.seekTo(10.0);
    s.seekHistory = [];
    p.playVideo();
  });
  await page.waitForTimeout(250);

  let ttsC2Started = { speakCount: ttsStarted.speakCount, speakingNow: false };
  for (let step = 0; step < 12; step++) {
    await page.evaluate(() => {
      const s = (window as unknown as { __mockYtState: { currentTime: number } }).__mockYtState;
      s.currentTime += 0.9;
    });
    await page.waitForTimeout(220);
    ttsC2Started = await page.evaluate(() => ({
      speakCount: (window as unknown as { __ttsSpeakCount: number }).__ttsSpeakCount,
      speakingNow: window.speechSynthesis.speaking,
    }));
    if (ttsC2Started.speakCount > ttsStarted.speakCount) break;
  }
  assert.ok(
    ttsC2Started.speakCount > ttsStarted.speakCount,
    `Expected fresh TTS-play utterance for Scenario C2 (before=${ttsStarted.speakCount}, now=${ttsC2Started.speakCount})`,
  );

  await page.evaluate(() => {
    const p = (window as unknown as { __mockYtPlayer: { seekTo: (s: number) => void } }).__mockYtPlayer;
    p.seekTo(110);
  });
  await page.waitForTimeout(1500);

  const afterNativeTtsSeek = await page.evaluate(() => {
    const s = (window as unknown as { __mockYtState: { currentTime: number; seekHistory: number[] } }).__mockYtState;
    return {
      currentTime: s.currentTime,
      seekHistory: [...s.seekHistory],
      cancelCount: (window as unknown as { __ttsCancelCount: number }).__ttsCancelCount,
    };
  });
  assert.ok(
    afterNativeTtsSeek.currentTime >= 109.0,
    `Native YT progress bar scrub to 110s during TTS-play must NOT be overwritten when section finishes (got ${afterNativeTtsSeek.currentTime.toFixed(2)}s, history=${JSON.stringify(afterNativeTtsSeek.seekHistory)})`,
  );
  console.log(
    `✅ PASS [Scenario C2 - Native YT Scrub During TTS-Play]: Player stayed at ${afterNativeTtsSeek.currentTime.toFixed(2)}s (cancelCount=${afterNativeTtsSeek.cancelCount}).`,
  );

  // --- Scenario D: Beginner Mode parity check ---
  await page.goto(`${APP_URL}/?v=L2Ryrr6txwA&mode=beginner`, { waitUntil: "domcontentloaded" });
  const begVideoTab = page.getByTestId("beginner-tab-video");
  await begVideoTab.waitFor({ state: "visible", timeout: 15000 });
  await begVideoTab.click();
  await page.waitForTimeout(300);

  const begLoadSample = page.getByTestId("btn-load-sample-subs");
  if ((await begLoadSample.count()) > 0 && (await begLoadSample.isVisible())) {
    await begLoadSample.click();
    await page.waitForTimeout(400);
  }

  const begSeekbar = page.getByTestId("player-control-seekbar");
  await begSeekbar.waitFor({ state: "visible", timeout: 10000 });
  await page.evaluate(() => {
    const p = (window as unknown as { __mockYtPlayer: { playVideo: () => void } }).__mockYtPlayer;
    p?.playVideo?.();
  });
  await page.waitForTimeout(200);
  await begSeekbar.evaluate((el: HTMLInputElement) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(el, "120");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(900);
  const afterBegSeek = await page.evaluate(() => {
    return (window as unknown as { __mockYtState: { currentTime: number } }).__mockYtState.currentTime;
  });
  assert.ok(
    afterBegSeek >= 119.0,
    `Beginner Mode seek to 120s must hold position (got ${afterBegSeek.toFixed(2)}s)`,
  );
  console.log(`✅ PASS [Scenario D - Beginner Mode Parity]: Player stayed at ${afterBegSeek.toFixed(2)}s.`);

  // Verify zero floating error buttons and zero uncaught page errors
  const floatingErrCount = await page.locator('[data-testid="floating-error-button"]').count();
  assert.strictEqual(floatingErrCount, 0, "Zero FloatingErrorButton alerts expected");
  assert.strictEqual(pageErrors.length, 0, `Zero page errors expected, got: ${pageErrors.join("; ")}`);
  console.log("✅ PASS: Live Chromium verification completed with zero errors.");

  await browser.close();
}

await runLiveBrowserCheck();
console.log("=========================================================================");
console.log("🎉 ALL TASK 420 SEEK / TTS-QUEUE OVERRIDE CHECKS PASSED!");
console.log("=========================================================================");
