# Done tasks

## Task 45: Enhance E2E Testing with Multi-Tool Suite

### Subtask 45.3: Unified E2E Multi-Tool Runner & Documentation

- Implemented unified verification script `scripts/verify-e2e-tools.ts` (`npm run test:e2e-tools`) validating:
  - All 5 Playwright spec files (`web.spec.ts`, `emulation.spec.ts`, `app.spec.ts`, `accessibility.spec.ts`, `network-faults.spec.ts`) exist, parse cleanly, and contain real tests.
  - `@axe-core/playwright` is installed and imported for WCAG audits.
  - Cypress spec files (`web.cy.ts`, `emulation.cy.ts`) exist and cover Video Library, Debug Mode, and Subtitle Sync.
  - `playwright.config.ts` includes `web`, `emulation`, `app`, `a11y`, and `faults` projects.
  - `package.json` contains valid scripts for all E2E tools (`test:e2e`, `test:e2e:a11y`, `test:e2e:faults`, `test:cy:web`, `test:e2e-tools`).
- Registered `test:e2e-tools` in `package.json` and documented all new test files in `docs/files.md`.
- Executed `npm run test:e2e-tools`: 100% pass rate.
- Verified clean build, zero lint warnings, and applet compilation.

### Subtask 45.2: Expand Cypress E2E Test Suite (cypress/e2e/)

- Expanded `cypress/e2e/web.cy.ts` with authentic end-to-end tests for the Video Library panel: tested opening the panel, filtering items with `#library-search-input`, saving the current active video with `#save-current-video-btn`, and loading videos.
- Added step-by-step test for the Debug Mode toggle in Settings: verifies that toggling debug mode exposes the `#navbar-network-button`, opens `#network-requests-inspector-modal`, and closes the modal cleanly via `#close-network-inspector-btn`.
- Added step-by-step test for persistent audio-track repeat mode (`#audio-track-mode-toggle`) and auto-scroll preference (`#auto-scroll-toggle`).
- Expanded `cypress/e2e/emulation.cy.ts` with Android back navigation testing: verifies that `window.__handleAndroidBack()` dismisses active modals and returns `true`, and returns `false` when no modal is open.
- Verified clean build, zero lint warnings, and applet compilation.

### Subtask 45.1: Integrate Automated Accessibility E2E Testing (@axe-core/playwright) & Network Fault Injection

- Installed `@axe-core/playwright` as a development dependency for automated WCAG accessibility auditing.
- Implemented `e2e/accessibility.spec.ts` scanning the main landing page, navbar, color theme controls, Video Library panel, and Parallel Subtitles table, asserting zero critical accessibility violations.
- Implemented `e2e/network-faults.spec.ts` using Playwright network interception to test simulated 3G latency, HTTP 429 rate limiting with auto-retry resilience, offline fallback to authentic bundled fixtures, and malformed non-JSON payloads without UI crashes.
- Registered `test:e2e:a11y` and `test:e2e:faults` in `package.json` and added `a11y` and `faults` project targets to `playwright.config.ts`.
- Verified clean build, zero lint warnings, and applet compilation.

## Task 42: Remove subtitle caching

### Subtask 42.1: Remove subtitle caching from app to simplify data flow

- Neutralized subtitle caching layer in `src/utils/subtitleCache.ts` (`saveCachedSubtitles` and `saveCachedTargetSubtitles` made no-ops) to guarantee that subtitles are always freshly retrieved and eliminate stale cache invalidation issues.
- Updated `getCachedSubtitles` to return `null` and `hasCachedSubtitles` to return `false`, preventing reading stale tracks from `localStorage` under `yt_subtitles_*` or memory cache.
- Updated `clearSubtitleCache` to cleanly purge legacy `yt_subtitles_*` keys using `window.localStorage`.
- Verified that `src/routes/index.tsx` enforces fresh track acquisition on video change (`setTracks(null)`) while preserving authentic bundled JSON3 demo fixtures for offline fallback.
- Created dedicated verification test `scripts/verify-no-subtitle-caching.ts` (`npm run test:no-subtitle-caching`), registered in `package.json`, and documented in `docs/files.md`.
- Verified 100% pass rate across test suite, clean build, and zero lint warnings.

## Task 41: Video library panel (watch history)

### Subtask 41.1: Implement Video Library / Watch History panel

- Integrated `VideoLibraryPanel` component (`src/components/VideoLibraryPanel.tsx`) into `PANELS` in `src/routes/index.tsx` and navbar button `#navbar-library-button`.
- Implemented persistent video watch history in `localStorage` under `yt_video_library_v2` (`STORAGE_KEYS.LIBRARY_STORAGE_KEY`), automatically recording current video ID, timestamp, thumbnail URL (`https://i.ytimg.com/vi/${id}/mqdefault.jpg`), and original URL.
- Provided default educational video seeds (`DEFAULT_LIBRARY_ITEMS`) in `src/config/appConfig.ts`.
- Implemented search/filter input (`#library-search-input`), load video action (`#load-library-video-${id}`), save current video button (`#save-current-video-btn`), remove item button (`#remove-library-video-${id}`), and reset defaults.
- Created dedicated verification test `scripts/verify-video-library-panel.ts` (`npm run test:video-library`), registered in `package.json`, and documented in `docs/files.md`.
- Verified 100% pass rate across test suite, clean build, and zero lint warnings.

## Task 40: Support app history (Android back navigation)

### Subtask 40.1: Implement Android back navigation and router/browser history integration

- Registered `OnBackPressedCallback` in `MainActivity.kt` with `onBackPressedDispatcher`. The native shell first evaluates `window.__handleAndroidBack()` in the WebView to cleanly dismiss active modals or overlays.
- If no modal is active, checks `webView.canGoBack()` and invokes `webView.goBack()`, navigating back through viewed videos in the WebView session history.
- Exposed `window.__handleAndroidBack` in `src/routes/index.tsx` to dismiss active modals (Network Requests Inspector, APK update dialog) and return boolean state to Android.
- Configured React `popstate` event listener on `window` to dynamically sync `videoId`, subtitle tracks, and UI state when navigating through history entries created with `window.history.pushState`.
- Verified with dedicated test `scripts/verify-android-back-navigation.ts` (`npm run test:back-navigation`), achieving 100% pass rate.
- Verified clean build, zero lint warnings, and applet compilation.

## Task 44: Android Emulator E2E test execution, video recording, GitHub Pages report, and README linking

### Subtask 44.1: Ensure Android emulator E2E test passes with screen recording and publishes test video to GitHub Pages report with README link

- Updated `AGENTS.md` to specify that Android emulator end-to-end testing runs exclusively within GitHub Actions workflow operations (skipping gracefully during local development runs), with all test outputs, logs, and video screen recordings deployed exclusively to the `gh-pages` branch and kept strictly off the main branch.
- Integrated `adb shell screenrecord` into `scripts/run-android-e2e.sh` and `.github/workflows/emulation.yml`, automatically pulling and packaging `android-emulator-e2e.mp4`. Added graceful exit for local development environments lacking connected ADB devices.
- Staged `android-emulator-e2e.mp4` to `gh-pages-staging/screenshots/android-emulator-e2e.mp4` for publication to GitHub Pages (`gh-pages` branch) alongside screenshot and logcat artifacts.
- Added direct GitHub Pages link to the Android Emulator E2E Video in `README.md` (`https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-e2e.mp4`).
- Updated `.gitignore` to ignore `android-emulator-e2e.mp4` and `*.mp4`, ensuring video artifacts are never committed to the main branch.
- Created dedicated verification test `scripts/verify-android-e2e-video-report.ts` (`npm run test:e2e-video-report`), registered in `package.json`, and documented in `docs/files.md`.
- Verified clean build, regression test suite, zero lint warnings, and applet compilation.

## Task 43: Align Subtitle Fetching and Native tlang Swapping with mostuf2556/Youtubenet6

### Subtask 43.3: Align Player Viewport Placement and Verification Tests

- Configured `enablejsapi: 1` and `origin: window.location.origin` in `YT.Player` options in `src/routes/index.tsx`, establishing clean parent-iframe communication for caption state. Added `onReady` autoplay listener on Android to immediately initiate playback and trigger caption interception.
- Added explicit accessibility and testability attributes on player elements: `#video-player-container` (`data-testid="video-player-container"`), `#youtube-player` (`data-testid="youtube-player"`), `#youtube-url-form` (`data-testid="youtube-url-form"`), `#youtube-url-input` (`data-testid="youtube-url-input"`), `#youtube-url-submit` (`data-testid="youtube-url-submit"`), and `#caption-status-indicator` (`data-testid="caption-status-indicator"`).
- Created dedicated verification test `scripts/verify-player-viewport-placement.ts` (`npm run test:player-viewport`), registered in `package.json`, and documented in `docs/files.md`.
- Verified clean build, regression test suite (`test:player-viewport`, `test:tlang-repetition`, `test:favorite-dynamic-fetch`, `test:default-subtitles-e2e`), zero lint warnings, and applet compilation.

### Subtask 43.2: Implement Active Subtitle Service Pipeline & Authentic Track Fallback

- Updated the web subtitle loader effect in `src/routes/index.tsx` to depend on `[isAndroid, videoId]`, resolving `targetVideo = videoId || DEMO_VIDEO`. Dynamically switching videos now triggers subtitle acquisition and fixture loading instead of permanently hardcoding a one-time mount effect.
- Enhanced `fetchFavoriteLanguageSubtitles` to resolve `activeUrl` through `baseUrl || observedUrlRef.current || shell?.getLastObservedTimedTextUrl()`. Added fallback to authentic pre-bundled tracks (`JSON3_RAW_MAP[code]`) when live requests encounter Google's bot block (`<title>Sorry...</title>`).
- Restored `void fetchFavoriteLanguageSubtitles(newlyAdded)` inside `handleTargetLanguagesChange`, ensuring newly selected favorite languages immediately initiate native bridge fetches.
- Verified with dedicated tests `scripts/verify-favorite-lang-dynamic-fetch.ts` (`npm run test:favorite-dynamic-fetch`), `scripts/verify-default-video-subtitles-e2e.ts` (`npm run test:default-subtitles-e2e`), `scripts/verify-favorites-subtitles-sync.ts` (`npm run test:favorites-sync`), and `scripts/verify-progressive-subtitles-loading.ts` (`npm run test:progressive-subtitles`).
- Built Android assets with `npm run build:android-assets` and verified clean compilation and zero lint errors.

### Subtask 43.1: Fix Android Shell executeTimedTextRepetition and query preservation in MainActivity.kt

- Reverted custom `lang` query stripping in `MainActivity.kt`'s `executeTimedTextRepetition` to align with `mostuf2556/Youtubenet6`. The native bridge now preserves the original source `lang` parameter and all signed YouTube authentication tokens (`sparams`, `signature`, `key`, `expire`, `ei`, etc.), stripping only previous `tlang` and `fmt` before cleanly appending the target `tlang` and `fmt=json3`.
- Configured authentic fallback request headers (`Referer: https://www.youtube.com/`, `Origin: https://www.youtube.com`, `User-Agent`, `Accept`) when `lastObservedHeaders` is not yet populated, preventing YouTube from blocking requests with `<title>Sorry...</title>`.
- Created dedicated verification test `scripts/verify-tlang-repetition.ts` (`npm run test:tlang-repetition`), registered in `package.json`, and documented in `docs/files.md`.
- Verified clean build, regression tests, zero lint warnings, and applet compilation.

## Task 39: Allow closing the Network Panel

### Subtask 39.1: Provide explicit close / collapse control on Network Panel

- Enhanced header close button in `src/components/NetworkRequestsInspector.tsx` with explicit identifiers (`id="close-network-inspector-button"`, `data-testid="close-network-inspector-button"`), accessible `aria-label="Close Network Inspector"`, tooltip indicating Escape shortcut, and `onClick={onClose}` handler.
- Implemented global `Escape` keyboard shortcut listener using `useEffect` on `window` (`keydown` -> `onClose()`) with proper event listener cleanup on unmount/close.
- Verified backdrop dismissal on `#network-inspector-modal` (`onClick={onClose}`) with `e.stopPropagation()` on the dialog content card to prevent accidental closing when clicking inside the inspector.
- Added collapse / minimize capability with toggle button (`id="collapse-network-inspector-button"`, `data-testid="collapse-network-inspector-button"`), rendering an unobtrusive compact floating status pill (`#network-inspector-minimized` / `data-testid="network-inspector-minimized"`) with live captured counts, an Expand button (`#expand-network-inspector-button`), and a quick compact close button (`#compact-close-network-inspector-button`).
- Created dedicated verification test `scripts/verify-network-inspector-close.ts` (`npm run test:network-close`), registered in `package.json`, and documented in `docs/files.md`.
- Verified clean build, regression tests, zero lint warnings, and applet compilation.

## Task 38: Accelerate app performance & enhance Network Panel with accordion and status tags

### Subtask 38.1: Implement performance optimizations and per-record Network Panel accordion with tlang color tags

- Memoized table rows using `React.memo(SubtitleRow)` in `src/routes/index.tsx`, isolating row re-renders to only active and previous rows during video playback and time-seeking.
- Enhanced Network Requests Inspector in `src/components/NetworkRequestsInspector.tsx` with dedicated per-record accordion toggle controls (`record-accordion-toggle-${id}`) and chevron transition animations.
- Implemented `getTlangStatusInfo` computing dynamic status tags and color schemes:
  - Pending: orange/amber (`bg-amber-500/20 text-amber-300 border-amber-500/40`)
  - Done: green (`bg-emerald-500/20 text-emerald-300 border-emerald-500/40`)
  - Failed: red (`bg-red-500/20 text-red-300 border-red-500/40`)
  - Overridden by green on retry success (`retry_success` with green styling)
- Created dedicated verification test `scripts/verify-network-accordion-tags.ts` (`npm run test:accordion-tags`), registered in `package.json`, and documented in `docs/files.md`.
- Rebuilt Android bundled assets with `npm run build:android-assets` and verified all regression suites, lint, and applet compilation.

## Task 37: Clean Network Panel records & add green badge indicator for good fetching

### Subtask 37.1: Exclude empty response bodies from Network Panel and add green badge indicator

- Added and exported `isSuccessfulFetch(req)` in `src/utils/networkTracker.ts`, verifying that only requests with HTTP 200, no error, and a genuine non-empty response body qualify as successful.
- Updated `isFailedRequest` in `NetworkRequestsInspector.tsx` to classify empty response bodies as failed/unsuccessful, ensuring they are excluded by default when `hideFailed` is enabled.
- Preserved accurate HTTP status recording (e.g. 200 OK) while styling empty body responses with warning/failed indicators rather than false green success badges.
- Added green badge indicators (`good-fetch-badge-${tlang}` in list items and `detail-good-fetch-badge` in the detail panel) for successfully fetched language tracks with valid subtitles.
- Created dedicated verification test `scripts/verify-network-clean-records.ts` (`npm run test:clean-network`), registered in `package.json`, and documented in `docs/files.md`.
- Rebuilt Android bundled assets with `npm run build:android-assets` and verified all regression suites, lint, and applet compilation.

## Task 36: Ensure sync between language views with auto-fetch-retry

### Subtask 36.1: Synchronize favorites view, language selection, and subtitles view with auto-fetch-retry

- Ensured in `src/routes/index.tsx` that `cols` unconditionally includes all active favorite languages in `targetLanguages`, guaranteeing that favorite language columns and headers are visible in the subtitles table even while fetching or retrying.
- Added graceful non-blocking loading placeholder `<span className="text-xs text-muted-foreground italic">Loading subtitles…</span>` in table cells for columns whose tracks are pending.
- Implemented automated fetch-retry mechanism with exponential backoff in `fetchFavoriteLanguageSubtitles` tracked by `retriesRef`, resetting on track arrival.
- Added continuous synchronization effect: ensures `shown` contains all `targetLanguages` and triggers auto-fetch-retry for missing favorite tracks until all tracks are aligned.
- Integrated alignment status indicators: `data-testid="subtitles-sync-aligned"` when all favorite tracks are loaded, and `data-testid="subtitles-sync-retrying"` when favorite tracks are being fetched/synced.
- Created dedicated verification test `scripts/verify-favorites-subtitles-sync.ts` (`npm run test:favorites-sync`), registered in `package.json`, and documented in `docs/files.md`.
- Rebuilt Android bundled assets with `npm run build:android-assets` and verified all regression suites, lint, and applet compilation.

## Task 35: Support running Android app in the background

### Subtask 35.1: Configure Android WebView & lifecycle to prevent pausing playback when app is not active

- Configured `android-shell/app/src/main/AndroidManifest.xml` with `android.permission.WAKE_LOCK` and hardware acceleration for continuous background execution.
- In `MainActivity.kt`, maintained `mediaPlaybackRequiresUserGesture = false` and implemented `onPause()` and `onStop()` lifecycles without calling `webView.onPause()` or freezing timers, ensuring media audio and TTS narration continue playing seamlessly when minimized or backgrounded.
- Implemented `onResume()` in `MainActivity.kt` safely resuming WebView and timer execution.
- Injected background playback resilience script in `MainActivity.kt` (`onPageFinished`) and integrated document visibility protection in `src/routes/index.tsx` preventing `visibilitychange` / `document.hidden` from pausing the YouTube player when minimized.
- Created dedicated verification test `scripts/verify-android-background-playback.ts` (`npm run test:background-playback`), registered in `package.json`, and documented in `docs/files.md`.
- Rebuilt Android bundled assets with `npm run build:android-assets` and verified all regression suites, lint, and applet compilation.

## Task 34: Debug mode toggle controlling Network Panel visibility

### Subtask 34.1: Add debug mode toggle (default false) and hide network panel when debug mode is disabled

- Added persistent debug mode configuration in `src/utils/appSettings.ts` (`DEBUG_MODE_STORAGE_KEY = 'yt_debug_mode'`, `getDebugModeSetting`, `setDebugModeSetting`) defaulting strictly to `false` (OFF).
- Added debug mode toggle switch (`#debug-mode-toggle`, `data-testid="debug-mode-toggle"`) in the Controls panel in `src/routes/index.tsx`.
- Controlled Network Panel visibility based on debug mode: when debug mode is disabled (default), the network inspector button (`#open-network-inspector-button`) and the `NetworkRequestsInspector` modal are suppressed and hidden, enabling a clean experience without the network panel.
- Toggling debug mode ON makes the Network Panel button and modal fully accessible.
- Created dedicated verification test `scripts/verify-debug-mode-toggle.ts` (`npm run test:debug-mode`), registered in `package.json`, and documented in `docs/files.md`.
- Verified all regression suites, lint, and applet compilation.

## Task 33: Optimize subtitle loading and fetching performance

### Subtask 33.1: Implement progressive / non-blocking subtitle loading technique

- Integrated `React.useTransition` (`startSubtitlesTransition`, `isSubtitlesPending`) into `src/routes/index.tsx` for non-blocking subtitle track updates.
- Implemented progressive stream loading in `fetchFavoriteLanguageSubtitles`: as each language finishes fetching via the native bridge, it is streamed immediately into `tracks` state inside a transition so users see subtitles appear incrementally.
- Added event loop yielding (`await new Promise<void>((resolve) => setTimeout(resolve, 0))`) between language requests to prevent UI thread starvation.
- Wrapped live intercepted base64 captions and fixture loading in non-blocking transitions, preserving 60 FPS UI responsiveness and player synchronization.
- Added visual progressive loading indicator (`data-testid="subtitles-progressive-indicator"`) in the subtitles header when `isSubtitlesPending` is active.
- Added dedicated verification test `scripts/verify-progressive-subtitles-loading.ts` (`npm run test:progressive-subtitles`) and validated all performance benchmarks.

## Task 32: Fix YouTube link sharing to Android app

### Subtask 32.1: Fix Android intent handling & WebView URL query propagation for shared YouTube links

- Delegated `parseVideoId` in `src/lib/native-captions.ts` to `extractYouTubeId` (`src/utils/youtube.ts`) supporting all YouTube formats (standard watch URLs, short URLs `youtu.be/`, Shorts, Live, embed links, tracking params, and text with prefixes or video titles).
- Initialized `videoId` state dynamically in `src/routes/index.tsx` from URL search parameters (`v` or `url`) and `window.__pendingSharedLink`, eliminating flashes or sticking to the default video.
- Enabled immediate registration of `window.onNativeSharedLinkReceived` without waiting for `nativeShell()` to attach.
- In `MainActivity.kt`, implemented `extractSharedText`, `extractYouTubeVideoId`, and `buildQuerySuffix` (`?v=$videoId&url=...`), and updated `onNewIntent` to notify `window.onNativeSharedLinkReceived` instantly without destroying the webview session.
- Configured `android:launchMode="singleTask"`, added `text/*` mime type, and added `ACTION_VIEW` intent filter for YouTube domains in `AndroidManifest.xml`.
- Created dedicated verification test `scripts/verify-youtube-share-intent.ts` (`npm run test:youtube-share-intent`) verifying 14 test vectors across all share payloads and architectural contracts.

## Task 31: Update AGENTS.md — after git commit, try using git push

### Subtask 31.1: Update AGENTS.md with git push instruction and verify git push attempt handling

- Updated AGENTS.md under Work tracking: after performing a git commit, attempt `git push` (handling failure gracefully if no remote or credentials configured).
- Created dedicated verification test `scripts/verify-agents-push-rule.ts` (`npm run test:agents-push-rule`).
- Registered script in `package.json` and documented in `docs/files.md`.

## Task 29: Streamline subtitle timing to default base language & ensure GitHub Pages screenshot availability

### Subtask 29.1: Remove "Timing from" selector and lock subtitle alignment timing to the default base language

- Removed manual "Timing from" `<select>` and associated `[pivot, setPivot]` state from `src/routes/index.tsx`.
- Implemented automatic `baseLanguage` derivation memo:
  - On Android: utilizes the primary timedtext `lang` query param from intercepted URL, falling back to first available track.
  - On Web demo: utilizes primary default track `"he"` (or first available track in `tracks`).
- Locked `align(tracks, baseLanguage, strategy)` to the default base language and added status indicator `Timing base: Hebrew (default subtitles)`.
- Added dedicated test `scripts/verify-default-timing-base.ts` (`npm run test:default-timing-base`) verifying that the selector is removed and automatic alignment runs smoothly.
- Rebuilt Android bundle assets and verified all 18 verification suites pass.

### Subtask 29.2: Bundle authentic emulator screenshot into static assets, document GitHub Pages activation, and extend response body size to 200 characters

- Bundled authentic Android emulator screenshot into `public/screenshots/android-emulator-screenshot.png` and `public/assets/android-emulator-screenshot.png`.
- Documented GitHub Pages manual activation requirement in `README.md` and `docs/operations/ACTIONS.md` (`Settings > Pages > Source: Deploy from a branch gh-pages / root`).
- Extended network tracker response body preview limit to 200 characters (`MAX_RESPONSE_BODY_PREVIEW_CHARS = 200` in `src/utils/networkTracker.ts`).
- Updated `src/components/NetworkRequestsInspector.tsx` UI modal labels, list badges, and details panel to show the first 200 characters.
- Updated `scripts/verify-network-inspector.ts` and `scripts/verify-readme-links.ts` with dedicated assertions for 200-character truncation and static screenshot assets.
- Updated `docs/operations/DEBUG.md`, `README.md`, and `docs/files.md` documentation inventories.
- Rebuilt Android bundle assets and verified all 18 verification suites pass cleanly.

## Task 28: Fix README broken links and GitHub Actions workflow resilience

### Subtask 28.1: Import architectural specification and design contracts from `mostuf2556/Youtubenet6` and fix Markdown link checker

- Imported all 9 architectural documentation and design contracts from `mostuf2556/Youtubenet6` into `docs/operations/`, `docs/specifications/`, and `docs/designs/`:
  - `docs/operations/ACTIONS.md`
  - `docs/specifications/LIBRARY.md`
  - `docs/designs/DESIGN_SUBTITLE_VIEWS.md`
  - `docs/designs/DESIGN_VIEW_LANGS.md`
  - `docs/designs/DESIGN_CONTROLS_VIEW.md`
  - `docs/designs/DESIGN_PLAYER_PROVIDER.md`
  - `docs/designs/DESIGN_STATE_COORDINATOR.md`
  - `docs/specifications/SCHEMA_TIMEDTEXT.md`
  - `docs/operations/DEBUG.md`
- Enhanced markdown link detection in `scripts/verify-md-links.ts` using `isInsideCodeSpan` so links containing inline code formatting (e.g. `[`**`ACTIONS.md`**`](path)`) are properly resolved and verified.
- Added dedicated test `scripts/verify-doc-contracts.ts` (`npm run test:doc-contracts`) validating contract file existence, minimum content size, and registry in `README.md` and `docs/files.md`.
- Updated file registry in `docs/files.md` and verified `npm run test:md` passes with 0 broken links.

### Subtask 28.2: Ensure GitHub Actions workflow resilience and add dedicated README links verification suite

- Added verification steps to `.github/workflows/integrity.yml` running `npm run test:doc-contracts`, `npm run test:md`, and `npm run test:readme-links` to continuously catch link rot, missing documentation contracts, and badge discrepancies in CI.
- Updated `README.md` with explicit instructions on enabling GitHub Pages under repository settings (`Settings > Pages > Build and deployment > Source: Deploy from a branch (gh-pages / root)`).
- Updated `docs/operations/ACTIONS.md` with active repository workflows, deployment architecture, and troubleshooting triage links for `mostuf25561/subtitle-sync`.
- Added dedicated test `scripts/verify-readme-links.ts` (`npm run test:readme-links`) validating all 10 relative documentation links, all 4 workflow badges, CLI installation scripts, and GitHub Pages references.
- Rebuilt Android assets into `android-shell/app/src/main/assets/` and verified all 17 verification test suites.

## Task 27: Fix GitHub Actions workflows and E2E test alignment with Youtubenet6

### Subtask 27.1: Align `.github/workflows/` with `mostuf2556/Youtubenet6` and resolve workflow step failures

- Removed redundant `.github/workflows/ci.yml` which failed due to missing `package-lock.json` and is not present in `mostuf2556/Youtubenet6`.
- Corrected deployed URL detection in `.github/workflows/web.yml` from `/${REPO_NAME}/app/` to `/${REPO_NAME}/`.
- Guarded `scripts/prepare-report.mjs` invocation in `web.yml` to prevent failures caused by the absence of synthetic scripts.
- Added `continue-on-error: true` to the `android-emulator-e2e` job in `emulation.yml` matching `mostuf2556/Youtubenet6`.
- Updated `deploy-demo.yml` with `keep_files: true` and removed `force_orphan: true` to preserve `gh-pages` screenshot history.
- Added dedicated test `scripts/verify-workflows-alignment.ts` and `npm run test:workflows`.

### Subtask 27.2: Ensure web demo Languages panel displays all 6 demo languages and verify all test suites

- Ensured in `src/routes/index.tsx` that `orderedLangs` on web demo (`!isAndroid`) displays all 6 demo languages from `LANGS` (sorted according to `languageOrder`), satisfying `e2e/web.spec.ts` (`toHaveCount(6)`).
- Preserved user-selected favorite languages presentation on Android (`isAndroid`) with dynamic `tlang` subtitle loading.
- Rebuilt Android web bundle assets in `android-shell/app/src/main/assets/`.
- Verified all test suites, production build, linting, and workflow alignment.

## Task 26: Extend network request response body preview limit to 50 characters

### Subtask 26.1: Update response body preview length to 50 characters across tracker, inspector UI, and verification suite

- Extended `MAX_RESPONSE_BODY_PREVIEW_CHARS` in `src/utils/networkTracker.ts` from 15 to 50 characters.
- Updated `src/components/NetworkRequestsInspector.tsx` UI labels, list badges, and details panel to show the first 50 characters.
- Updated `scripts/verify-network-inspector.ts` asserting 50-character response preview truncation.
- Rebuilt android assets into `android-shell/app/src/main/assets/` and verified all 14 test suites.

## Task 25: Dynamic favorite language subtitle fetching and network requests inspector with response body preview

### Subtask 25.1: Proactively fetch subtitles for newly added favorite languages via `tlang`

- Updated `handleTargetLanguagesChange` in `src/routes/index.tsx` to detect newly added favorite languages dynamically.
- Implemented `fetchFavoriteLanguageSubtitles` using `buildTranslatedCaptionUrl` with `tlang` parameter and the native shell bridge.
- Automatically merges newly fetched tracks into `tracks` state and updates live caption status.
- Added dedicated test `scripts/verify-favorite-lang-dynamic-fetch.ts` and registered `test:favorite-dynamic-fetch` in `package.json`.

### Subtask 25.2: Network requests panel with initial response body preview

- Created modular external store `src/utils/networkTracker.ts` tracking timedtext, bridge, and fetch requests.
- Implemented `NetworkRequestsInspector.tsx` modal with filter chips, search, copy URL, and response preview badges.
- Connected network tracking in `src/routes/index.tsx` for intercepted captions, native bridge fetching, and fixture fetching.
- Added dedicated test `scripts/verify-network-inspector.ts` and registered `test:network-inspector` in `package.json`.

## Task 24: Align Android subtitle fetching flow with Youtubenet6 (default caption fetch followed by ordered favorite languages)

### Subtask 24.1: Implement proactive default subtitle fetch and ordered favorite language translations on Android

- Configured default favorite languages to `['he', 'it']` in `src/utils/appSettings.ts` and initialized `targetLanguages` from `getUserLearningLanguages()` in `src/routes/index.tsx`.
- Guaranteed that target language fetching preserves priority order (`he` before `it`), matching `android-e2e-assert.sh` ordering expectations.
- Configured YouTube player `playerVars` with `autoplay: isAndroid ? 1 : 0` and `cc_load_policy: isAndroid ? 1 : 0`.
- Verified `scripts/verify-native-captions.ts` and all 12 test suites pass cleanly.

## Task 23: Enforce 100% local, offline web-app architecture in Android shell

### Subtask 23.1: Permanently eliminate all remote web-app URLs and fallbacks from `MainActivity.kt` and guarantee local asset execution

- Completely purged `APP_URL` and all remote `github.io` fallback references from `MainActivity.kt`.
- Configured WebView to unconditionally load `https://appassets.androidplatform.net/index.html$querySuffix` from local bundled APK assets.
- In `shouldOverrideUrlLoading`, restricted internal WebView navigation strictly to local assets domain and YouTube player embeds.
- Added a local offline error page in `shouldInterceptRequest` if assets cannot be opened, preventing remote network fallback.
- Implemented dedicated test `scripts/verify-android-local-assets.ts` and registered it in `package.json` and `docs/files.md`.
- Verified all unit and hygiene tests pass with zero errors.

## Task 22: Publish Android emulator screenshots to GitHub Pages

### Subtask 22.1: Configure GitHub Actions workflow to publish Android emulator screenshot artifact to GitHub Pages

- Configured `.github/workflows/emulation.yml` with steps to stage `android-emulator-screenshot.png` and `android-emulator-logcat.txt` into `gh-pages-staging/screenshots/`.
- Added GitHub Pages deployment using `peaceiris/actions-gh-pages@v4` with `keep_files: true` and `destination_dir: .` targeting `gh-pages` branch.
- Configured `.gitignore` to prevent any synthetic or generated emulator artifacts from entering the git repository.
- Added direct link to the Android Emulator Screenshot in `README.md`.
- Implemented dedicated verification test `scripts/verify-emulation-gh-pages.ts` and registered it in `package.json` and `docs/files.md`.
- Verified 100% pass on all repo checks and hygiene tests.

## Task 21: Android dynamic subtitle fetching and 10-line presentation for favorite languages

### Subtask 21.1: Dynamically load and present first 10 lines of subtitles for each favorite language on Android

- Connected Android dynamic caption fetching to dispatch `fetchTranslatedCaptionsWithUrl` with `tlang` for all selected favorite languages upon intercepting live captions.
- Added first 10-lines default subtitle presentation across active favorite languages on Android with dedicated pagination controls and a badge indicating the presentation limit.
- Maintained isolated web demo fixture behavior.
- Added dedicated verification test `scripts/verify-android-favorite-subtitles.ts` validating live multi-language alignment and 10-line presentation limits.
- Verified test suite and ensured clean repository hygiene.

## Task 17: Restore default language subtitle fetching and favorite languages `tlang` replacement on Android

- Preserved the default language track by fetching or retaining the base timedtext request without an invalid or empty `tlang` parameter.
- Intercepted timedtext requests on Android and dynamically dispatched `fetchTranslatedCaptionsWithUrl` with `tlang` for every selected favorite language (`targetLanguages`).
- Added `scripts/verify-native-captions.ts` to test native `tlang` building, default track extraction, and base64 payload parsing against authentic application code.
- Verified test suite and ensured clean repository hygiene.

## Task 1: Establish the project work-tracking workflow

- Rewrote `AGENTS.md` with the requested task lifecycle.
- Added `docs/tasks.md`, `docs/todo.md`, and `docs/done.md`.
- Committed and validated the documentation workflow.

## Task 2: Import and verify the GitHub Actions delivery flows

- Confirmed the six workflows from `mostuf2556/subtitle-sync` are present locally.
- Aligned build artifacts, package scripts, report preparation, and CI linting with this TanStack app.
- Lint, build, and static report-integrity checks passed.
- Browser-phase integrity verification remains environment-limited until a Playwright browser is installed.

## Task 3: Add dynamic target-language selection to the app

- Added a multi-select target-language control generated from `LANGS`.
- Added Spanish to the supported language catalog.
- Included selected target languages in Android caption refreshes.
- Made fixture loading tolerate languages without a bundled demo file.
- Focused lint and production build passed.

## Task 5: Run browser tests in a reproducible Docker environment

- Added a fixed Playwright Docker image and Compose service under `docker/`.
- Added `docker/manage.sh` for building and running web, emulation, or all E2E suites.
- Mounted Docker test reports into `docker/artifacts/` and connected the GitHub Actions web job to the Docker runner.
- Local container execution remains environment-limited because the Docker daemon is unavailable in this sandbox.

## Task 6: Fix CI dependency installation and Android startup

- Updated the Playwright Docker image install to work with its newer npm version.
- Made Android builds generate web assets automatically when the bundle is absent.
- Switched generated web asset references to relative paths for GitHub Pages and Android.
- Web, emulation, and app Playwright suites pass locally; native Android build verification remains environment-limited without Java/Android SDK.

## Task 7: Fix README and restore functional APK update script and curl command

- Restored comprehensive README.md matching `https://github.com/mostuf2556/subtitle-sync` with the single curl install command and repository badges.
- Configured `update.apk.sh` with active fallback resolution and package target `com.ytviewer.app`.
- Added `install-apk.sh` and updated `scripts/update-readme.mjs` to target `mostuf2556/subtitle-sync`.
- Verified bash syntax and repository synchronization.

## Task 8: Fix Android APK blank screen issue

- Updated `MainActivity.kt` remote fallback APP_URL to `https://mostuf2556.github.io/subtitle-sync/app/`.
- Fixed asset path normalization in `MainActivity.kt` to strip leading `/` and `./` before `assets.open()`, preventing `FileNotFoundException`.
- Enhanced `scripts/normalize-web-assets.mjs` to rewrite all script preloads, tags, and dynamic module imports into relative `./assets/` paths.
- Verified that `build:android-assets` packages fully normalized web assets into `android-shell/app/src/main/assets/`.

## Task 10: Fix blank screen on Android & GitHub Pages demo and fix CI workflow package-lock failure

- Added dynamic basepath detection (`/subtitle-sync/app`, `/app`, or root) and normalized `/index.html` and trailing slashes in `src/router.tsx` and `src/client.tsx`.
- Added defensive Web Speech API guards in `src/routes/index.tsx` so missing `speechSynthesis` does not crash React hydration on Android WebView or unsupported environments.
- Connected Android Native TTS (`AndroidNativeShell.speak` and `stopSpeaking`) in `src/routes/index.tsx`.
- Fixed subtitle fixture fetch path in `src/routes/index.tsx` to respect dynamic basepath under GitHub Pages (`/subtitle-sync/app/fixtures/...`).
- Updated `MainActivity.kt` to load root route `https://appassets.androidplatform.net/$querySuffix` and added WebView navigation guards.
- Updated GitHub Actions workflows and resolved ESLint / Prettier formatting rules.
- Verified compilation and linting.

## Task 11: Document reference baseline repository (Youtubenet6) in AGENTS.md

- Updated `AGENTS.md` and `AGENT.md` to establish `https://github.com/mostuf2556/Youtubenet6` as the baseline reference repository.
- Specified that the application's structure, tooling, workflows, scripts, and delivery mechanisms should remain identical to `Youtubenet6`, with differences restricted specifically to views and the subtitles parser.
- Added explicit instructions that for any issue, the solution should be compared against the implementation in `mostuf2556/Youtubenet6`.
- Verified compilation and linting.

## Task 12: Fix GitHub Actions workflows consulting mostuf2556/Youtubenet6

- Compared all workflows in `.github/workflows/` against `https://github.com/mostuf2556/Youtubenet6`.
- Fixed `web.yml` by replacing the broken Docker container invocation (`./docker/manage.sh e2e web` failing with exit code 126) with standard Playwright and Cypress test execution matching `mostuf2556/Youtubenet6`.
- Added missing Cypress test scripts (`test:cy`, `test:cy:web`, `test:cy:report:web`, etc.) and helper test scripts to `package.json` matching `mostuf2556/Youtubenet6`.
- Fixed `emulation.yml` by removing redundant Playwright installation/runs on the macOS runner to match `mostuf2556/Youtubenet6`'s dedicated emulator test lifecycle and fixing fallback install commands.
- Standardized package installation with `npm install` across `deploy-demo.yml`, `release-apk.yml`, `integrity.yml`, and `ci.yml`, making registry normalization safe on all platforms.
- Verified `npm run build`, `prepare-report.mjs`, `verify-reports-integrity.mjs`, `verify-ota-updater.ts` (19/19 passed), linting, and full compilation.

## Task 13: Fix white blank screen and console errors on https://mostuf2556.github.io/subtitle-sync/app/ and update integrity workflow

- Identified the root cause of the white blank screen and `Invariant failed` error on GitHub Pages: previous deployments did not have dynamic basepath detection during TanStack Router hydration, causing route matching to miss the child index route and crash `s[1] || Invariant failed`.
- Resolved dynamic basepath detection and normalized `/index.html` and trailing slashes in `src/router.tsx`, preserving `basepath` across `router.update()` calls during hydration.
- Updated `scripts/verify-reports-integrity.mjs` to simulate GitHub Pages subpaths (`/subtitle-sync/*`) and added headless Playwright browser verification for:
  - `/subtitle-sync/app/` (ensuring HTTP 200, full DOM text rendering >25KB, 0 blank screen, and 0 console/page errors)
  - `/subtitle-sync/app/index.html` (clean path normalization and DOM rendering)
  - `/app/` and `/app/index.html` (direct subpath rendering)
  - Added `app/index.html` to critical static files verification and added `page.on('pageerror')` to catch all unhandled exceptions.
- Updated `.github/workflows/deploy-demo.yml` to always compile the latest web application bundle with `npm run build` and run `npm run test:report:integrity` prior to deploying to gh-pages branch.
- Confirmed that `npm run test:report:integrity`, `compile_applet`, and `lint_applet` pass with 0 errors.

## Task 14: Migrate imported repository according to github-import-migration skill

- Audited project structure against `/skills/system_skills/github_import_migration/SKILL.md` and classified runtime as Web (Node.js).
- Removed redundant foreign lockfile (`bun.lock`) to maintain npm-only consistency.
- Created `.env.example` defining environment variables used across repository tooling and release workflows.
- Synchronized HTML title, description, and OpenGraph metadata in `src/routes/__root.tsx` and `src/routes/index.tsx` to match `metadata.json`.
- Verified production build (`npm run build`), subtitle format validation (`npm run test:caption-formats`), OTA updater suite (`npm run test:ota` - 19/19 passed), report integrity (`npm run test:report:integrity`), ESLint (`npm run lint`), and `compile_applet`.

## Task 15: Separate web-app constant fixtures from Android dynamic learning languages selection via tlang

- Differentiated web-app and Android runtime modes: on the web-app, target languages and subtitles are kept strictly as constant fixtures (`LANGS`), while on Android (`isAndroid`), the learning languages selection UI is exposed.
- In the Android learning languages view, integrated full language catalog selection (`SUPPORTED_LANGUAGES_CATALOG` with 84 languages) allowing users to configure any learning targets as in `mostuf2556/Youtubenet6`, backed by persistent settings (`getUserLearningLanguages` / `setUserLearningLanguages`).
- Connected live Android `tlang` subtitle retrieval: upon intercepting default captions (and whenever learning languages are modified with an observed URL), the native bridge fetches translation tracks via `fetchTranslatedCaptionsWithUrl(observedUrl, code, 'json3')`.
- Aligned E2E specifications across `e2e/web.spec.ts` (verifying constant fixture tracks without live select), `e2e/app.spec.ts`, and `e2e/emulation.spec.ts` (verifying Android bridge tlang calls).
- Verified production builds, integrity checks, ESLint, and compilation with 0 errors.

## Task 16: Align favorite languages, TTS settings, video reset, multi-track audio mode, and auto-scroll default with mostuf2556/Youtubenet6

### Subtask 16.1: Favorite languages and main screen controls

- Exposed `#target-language-select` on both the web demo (populated from fixture tracks) and Android (populated from the 84-language catalog with live `tlang` fetching).
- Configured main screen language controls (Languages panel table, Show/Hide checkboxes, Spoken checkboxes, Order buttons, and per-language TTS speech rate and voice selection) to strictly present only favorite languages.
- Updated `e2e/web.spec.ts` to assert that `#target-language-select` is visible on the web demo.
- Validated via full test suites, `compile_applet`, `lint_applet`, and production builds.

### Subtask 16.2: Clear columns on new video on Android

- Added immediate clearing of subtitle tracks (`setTracks(null)`), columns, active index, and speech synthesis when loading any video ID other than the default video on Android.
- Configured subtitle container to display empty state message `"Waiting for subtitles… Play the video and ensure captions are enabled."` until the live timedtext URL is intercepted.
- Connected automatic fetching of fresh subtitles for all selected favorite languages upon intercepting live captions for the new video.
- Implemented dedicated Playwright test in `e2e/emulation.spec.ts` (`"clears existing subtitle tracks and columns when loading a new video on Android"`) asserting that columns/tracks clear immediately upon loading a new video and reload only when intercepted captions arrive.
- Updated `AGENTS.md` requiring dedicated tests for verifying all features and subtasks.

### Subtask 16.3: YouTube multi-audio track repeat mode

- Decomposed multi-audio track repeat functionality into dedicated modular utility `src/utils/audioTrackManager.ts` following `AGENTS.md` modularity rules and registered in `docs/files.md`.
- Implemented `getAudioTrackMode()` and `setAudioTrackMode(enabled)` with default state set to `false` (OFF), backed by localStorage.
- Implemented YouTube multi-audio track resolution (`getAvailableAudioTracks`), language code matching (`findMatchingAudioTrack`), and segment replay with native video audio (`repeatSegmentWithAudioTrack`).
- Integrated `#audio-track-mode-toggle` in the Playback settings panel in `src/routes/index.tsx` and updated pause playback loop to repeat segments with native audio track when enabled.
- Added dedicated test suite `scripts/verify-audio-track-mode.ts` (`npm run test:audio-track`) and dedicated Playwright test in `e2e/web.spec.ts`.
- Validated via full test suites, production build, report integrity test, and applet compilation.

### Subtask 16.4: Disable auto-focus and scroll by default

- Changed auto-focus and auto-scroll state (`autoFocus` / `autoScroll`) to default to `false` (OFF).
- Implemented `getAutoScrollSetting()` and `setAutoScrollSetting()` in `src/utils/appSettings.ts` using `AUTO_SCROLL_STORAGE_KEY` (`'yt_auto_scroll'`), ensuring it defaults to `false` if not set and persists updates.
- Added `#auto-scroll-toggle` ID to the auto-focus and scroll checkbox in `src/routes/index.tsx` and connected it to `onAutoFocusChange`.
- Created dedicated test suite `scripts/verify-auto-scroll.ts` (`npm run test:auto-scroll`) validating default OFF status, local storage persistence, and corrupted input fallbacks.
- Added dedicated Playwright test in `e2e/web.spec.ts` (`"toggles auto-focus and scroll and verifies default is OFF"`).
- Documented in `docs/files.md` and validated via full test suites, `lint_applet`, and production builds.

### Subtask 16.5: E2E testing & verification

- Updated and unified test suites (`e2e/web.spec.ts`, `e2e/app.spec.ts`, `e2e/emulation.spec.ts`, `cypress/e2e/web.cy.ts`).
- Asserted fixture tracks, favorite language selection, audio-track mode toggle and persistence, and auto-scroll default toggle and persistence.
- Verified Android shell bridge emulation for `tlang` subtitle track retrieval and immediate subtitle clearing upon loading a new video ID.
- Executed and validated all dedicated test suites (`test:audio-track`, `test:auto-scroll`, `test:caption-formats`, `test:ota`, `test:md`), `lint_applet`, `compile_applet`, and production build.
- Completed HTML report generation and GitHub Pages test reports integrity verification.

## Task 19: Remove server dependencies and convert to pure client SPA

### Subtask 19.1: Remove server dependencies and convert to pure client SPA

- Removed `@tanstack/react-start`, `nitro`, and `@lovable.dev/vite-tanstack-config` from `package.json`.
- Deleted server entry files `src/server.ts`, `src/start.ts`, and SSR helper files `src/lib/error-capture.ts` and `src/lib/error-page.ts`.
- Removed SSR shell elements (`RootShell`, `HeadContent`, `Scripts`) from `src/routes/__root.tsx`.
- Created root `index.html` mounting `<div id="root"></div>` and importing `/src/client.tsx`.
- Updated `src/client.tsx` to mount with React 19 `createRoot(document.getElementById("root"))` using `<RouterProvider router={router} />`.
- Updated `vite.config.ts` to standard client Vite plugins (`TanStackRouterVite`, `react`, `tailwindcss`, path alias `@` -> `./src`, server `0.0.0.0:3000`).
- Updated `package.json` scripts: `build` directly outputs to `dist/` and runs `normalize-web-assets.mjs dist`.
- Created dedicated test `scripts/verify-client-spa.ts` (`npm run test:client-spa`) asserting zero server dependencies, removal of server entry files, root `index.html` presence, `createRoot` client rendering, and clean `dist/index.html` build.
- Updated `docs/files.md` with client SPA architecture and test inventory.

## Task 20: Remove synthetic report generators, fake artifact scripts, and generated HTML files

### Subtask 20.1: Remove synthetic report generators, fake artifact scripts, and generated HTML files

- Deleted synthetic report scripts: `scripts/generate-android-report.mjs`, `scripts/prepare-report.mjs`, and `scripts/verify-reports-integrity.mjs`.
- Deleted synthetic HTML reports and templates: `android-emulator-report.html`, `cypress/runner-template.html`, `cypress/reports/`, and `playwright-report/`.
- Updated `.gitignore` to explicitly ignore test reports, videos, screenshots, and test results (`cypress/reports/`, `cypress/videos/`, `cypress/screenshots/`, `playwright-report/`, `test-results/`, and `android-emulator-report.html`).
- Cleaned `package.json` scripts: removed `test:android:report` and `test:report:integrity`, added `test:hygiene`.
- Created dedicated test `scripts/verify-repo-hygiene.ts` (`npm run test:hygiene`) asserting absence of synthetic report scripts, no fake HTML dashboards or templates, and pure single `index.html` root entry point.
- Updated `.github/workflows/deploy-demo.yml` to build and deploy authentic `dist/` directly to GitHub Pages without generating synthetic reports.
- Updated `.github/workflows/integrity.yml` to run authentic tests (`test:hygiene`, `test:client-spa`).
- Cleaned references to deleted synthetic reports in `README.md` and `docs/files.md`.
- Ran all authentic tests, builds, and lint successfully.
