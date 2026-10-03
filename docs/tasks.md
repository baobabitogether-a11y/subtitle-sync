# Tasks

## Task 31: Update AGENTS.md — after git commit, try using git push

- [x] **Subtask 31.1: Update AGENTS.md with git push instruction and verify git push attempt handling**: Update AGENTS.md under Work tracking to specify that after performing a git commit, attempt `git push` (handling failure gracefully if no remote or credentials configured). Add dedicated test to verify this rule and workflow integrity.

## Task 32: Fix YouTube link sharing to Android app

- [x] **Subtask 32.1: Fix Android intent handling & WebView URL query propagation for shared YouTube links**: Diagnose and fix why sharing a YouTube URL/intent to Android keeps showing the default video. Ensure MainActivity intent filters, extras (`Intent.EXTRA_TEXT`), query parameter extraction (`v=` or `youtu.be/` video ID), and WebView local asset URL generation (`index.html?v=...`) reliably update React app state and switch to the shared video. Add dedicated verification test.

## Task 33: Optimize subtitle loading and fetching performance

- [x] **Subtask 33.1: Implement progressive / non-blocking subtitle loading technique**: Ensure subtitle parsing and network fetching do not block or stutter the UI/player, employing progressive chunked loading, idle callbacks, or microtask batching. Add dedicated performance verification test.

## Task 34: Debug mode toggle controlling Network Panel visibility

- [x] **Subtask 34.1: Add debug mode toggle (default false) and hide network panel when debug mode is disabled**: Allow using the app without the network panel. Add a settings toggle for debug mode, defaulting to `false`. Add dedicated verification test.

## Task 35: Support running Android app in the background

- [x] **Subtask 35.1: Configure Android WebView & lifecycle to prevent pausing playback when app is not active**: Ensure WebView does not pause media on pause/background (`setMediaPlaybackRequiresUserGesture(false)`, background audio flags, keeping WebView active in onPause/onStop where appropriate). Add dedicated verification test.

## Task 36: Ensure sync between language views with auto-fetch-retry

- [x] **Subtask 36.1: Synchronize favorites view, language selection, and subtitles view with auto-fetch-retry**: Ensure every favorite language is consistently present in the subtitles view. If a favorite language track fails or is missing, automatically trigger auto-fetch-retry until aligned. Add dedicated verification test.

## Task 37: Clean Network Panel records & add green badge indicator for good fetching

- [x] **Subtask 37.1: Exclude empty response bodies from Network Panel and add green badge indicator**: Do not list requests with no response body as successful. Ensure HTTP status reflects actual responses. Add green badge indicator for successfully fetched languages. Add dedicated verification test.

## Task 38: Accelerate app performance & enhance Network Panel with accordion and status tags

- [x] **Subtask 38.1: Implement performance optimizations and per-record Network Panel accordion with tlang color tags**: Add memoization/rendering optimizations. Enhance Network Panel with accordion per record and tlang tags with status colors (pending: orange, done: green, failed: red, overridden by green on retry success). Add dedicated verification test.

## Task 39: Allow closing the Network Panel

- [x] **Subtask 39.1: Provide explicit close / collapse control on Network Panel**: Allow users to close the network panel easily via close button, escape key, or backdrop click. Add dedicated verification test.

## Task 40: Support app history (Android back navigation)

- [x] **Subtask 40.1: Implement Android back navigation and router/browser history integration**: Support Android back button events (`onBackPressed` / WebView `canGoBack()` or React popstate) to navigate back through viewed videos and panels instead of exiting immediately. Add dedicated verification test.

## Task 41: Video library panel (watch history)

- [x] **Subtask 41.1: Implement Video Library / Watch History panel**: Maintain a persistent history of played YouTube videos (ID, title, timestamp, thumbnail) with quick reload / selection. Add dedicated verification test.

## Task 42: Remove subtitle caching

- [x] **Subtask 42.1: Remove subtitle caching from app to simplify data flow**: Eliminate caching layers for subtitles (`subtitleCache.ts`, etc.) so subtitles are freshly retrieved without cache invalidation issues. Add dedicated verification test.

## Task 43: Align Subtitle Fetching and Native tlang Swapping with mostuf2556/Youtubenet6

- [x] **Subtask 43.1: Fix Android Shell executeTimedTextRepetition and query preservation in MainActivity.kt**: Revert custom lang stripping in executeTimedTextRepetition to match Youtubenet6: preserve the original source lang parameter and all signed YouTube authentication tokens, strip only old tlang and fmt, and cleanly append target tlang and fmt=json3. Add dedicated test.
- [x] **Subtask 43.2: Implement Active Subtitle Service Pipeline & Authentic Track Fallback**: Add proactive subtitle fetching and authentic fixture fallback for target languages when live fetching meets network/bot restrictions. Fix videoId change reactivity in index.tsx and restore fetchFavoriteLanguageSubtitles in handleTargetLanguagesChange. Add dedicated tests.
- [x] **Subtask 43.3: Align Player Viewport Placement and Verification Tests**: Position player container cleanly in Android viewport so automated and user taps reliably start playback and trigger YouTube caption requests. Verify with full test suite, build Android assets, and check compilation.

## Task 44: Android Emulator E2E test execution, video recording, GitHub Pages report, and README linking

- [x] **Subtask 44.1: Ensure Android emulator E2E test passes with screen recording and publishes test video to GitHub Pages report with README link**: Verify `run-android-e2e.sh`, `android-e2e-assert.sh`, screen recording via `adb shell screenrecord`, integration into `.github/workflows/deploy-demo.yml` / GitHub Pages report generator, and ensure the video is linked in `README.md`. Add dedicated verification test.

## Task 45: Enhance E2E Testing with Multi-Tool Suite

- [x] **Subtask 45.1: Integrate Automated Accessibility E2E Testing (@axe-core/playwright) & Network Fault Injection**: Install and configure `@axe-core/playwright` for end-to-end accessibility WCAG scans across player, subtitles table, and Video Library. Implement Playwright network condition E2E tests simulating offline, 3G throttle, and HTTP 429 rate limiting.
- [x] **Subtask 45.2: Expand Cypress E2E Test Suite (cypress/e2e/)**: Enhance `cypress/e2e/web.cy.ts` and `cypress/e2e/emulation.cy.ts` to test Video Library search/load/remove, Debug Mode toggle, and audio-track loop controls.
- [x] **Subtask 45.3: Unified E2E Multi-Tool Runner & Verification**: Implement unified verification script `scripts/verify-e2e-tools.ts` (`npm run test:e2e-tools`), assert tool readiness, and document in `docs/files.md`.

## Task 46: Auto Android Version Bump using GitHub Actions Flow

- [ ] **Subtask 46.1: Implement Android Version Bump CLI Script (`scripts/bump-android-version.ts`)**: Implement script to parse, increment, and write `versionCode` (integer increment) and `versionName` (semantic increment: patch/minor/major or run-number) in `android-shell/app/build.gradle.kts` and sync `package.json`.
- [ ] **Subtask 46.2: Create GitHub Actions Workflow for Auto Android Version Bump (`.github/workflows/bump-version.yml`)**: Automate version bumping via GitHub Actions with manual dispatch and push options, committing updated files with `[skip ci]` and optional release tagging.
- [ ] **Subtask 46.3: Implement Dedicated Verification Test (`scripts/verify-android-version-bump.ts`) & Documentation**: Create verification test checking script execution, regex fidelity, increment arithmetic, workflow syntax, and document in `docs/files.md`.
