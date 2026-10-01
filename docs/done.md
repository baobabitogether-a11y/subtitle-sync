# Done tasks

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







