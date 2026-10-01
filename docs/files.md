# Code Files Inventory

This document maintains the registry of codebase files, their specific roles, architectural responsibilities, and feature domain boundaries.

## Application Architecture & Routing

| File Path | Role | Feature & Responsibilities |
|---|---|---|
| `index.html` | Application HTML Entry Point | Root HTML5 template mounting the React SPA into `#root`. |
| `src/routes/index.tsx` | Main Workspace View | Orchestrates player view, playback controls, parser selector, language controls, and parallel subtitle table. |
| `src/routes/__root.tsx` | Root Layout | Provides document shell, theme styling containers, QueryClient context, and child route outlet. |
| `src/router.tsx` | Router Definition | Configures TanStack Router instance and integrates generated route tree. |
| `src/client.tsx` | Client Mount Entry | Initializes client-side rendering with `createRoot` and mounts the router into the DOM. |

## Subtitles & Alignment Core (`src/lib/`)

| File Path | Role | Feature & Responsibilities |
|---|---|---|
| `src/lib/subtitles.ts` | Subtitle Alignment Engine | Implements sentence, word, raw segment, and linear blend alignment across multi-language JSON3 tracks. |
| `src/lib/native-captions.ts` | Native Android Bridge Interop | Decodes intercepted base64 caption payloads and extracts timedtext URL parameters. |
| `src/lib/lovable-error-reporting.ts` | Lovable Studio Telemetry | Dispatches runtime error reports to the Lovable integration layer. |
| `src/lib/utils.ts` | UI Utilities | Provides class name concatenation (`cn`) merging Tailwind classes and clsx. |
| `src/components/NetworkRequestsInspector.tsx` | Network Traffic Inspector UI | Displays live captured network requests with URL, method, status, duration, and first 15 characters response body preview. |

## Feature Utilities (`src/utils/`)

| File Path | Role | Feature & Responsibilities |
|---|---|---|
| `src/utils/youtube.ts` | YouTube Player & URL Utility | Parses video IDs, validates URLs, and configures YouTube iframe player parameters. |
| `src/utils/captionParser.ts` | Caption Normalizer | Validates and converts varying caption schemas into normalized subtitle events. |
| `src/utils/appSettings.ts` | Preferences & State Persistence | Manages local storage persistence for learning languages, TTS settings, and app snapshots. |
| `src/utils/audioTrackManager.ts` | Multi-Audio Track & Repeat Manager | Manages Audio-Track Mode preferences, native YouTube audio track matching, and segment repeating. |
| `src/utils/apkUpdater.ts` | OTA Hot Update Manager | Checks GitHub Releases, downloads release zip artifacts, and performs live web bundle updates. |
| `src/utils/networkInterceptor.ts` | Network Traffic Interceptor | Monitors browser requests to capture YouTube timedtext subtitle URLs. |
| `src/utils/networkTracker.ts` | Live Network Request Tracker | Records timedtext, bridge, and fetch requests, keeping response bodies strictly truncated to the first 15 characters. |
| `src/utils/rtlUtils.ts` | Text Direction Manager | Detects RTL languages (Hebrew, Arabic, etc.) and formats directional rendering. |
| `src/utils/subtitleCache.ts` | Subtitle Cache Service | Stores fetched subtitles in local browser storage to support offline replay. |
| `src/utils/urlStateManager.ts` | URL Parameter Synchronizer | Reflects active video, languages, and settings into query parameters for deep linking. |
| `src/utils/videoSettings.ts` | Per-Video Preferences Store | Persists language choices and playback configurations specific to individual video IDs. |
| `src/utils/logBuffer.ts` | Diagnostic Log Buffer | Captures and retains rolling logs for network, bridge, and playback diagnostic inspection. |

## Configuration & Data Fixtures (`src/config/`)

| File Path | Role | Feature & Responsibilities |
|---|---|---|
| `src/config/appConfig.ts` | App Config & Constants | Defines storage keys, default settings, and system-wide constants. |
| `src/config/constants.ts` | Language Catalogs | Holds supported language definitions, ISO language codes, and default video constants. |
| `src/config/fixtures.ts` | Test Fixture Data | Supplies mock subtitles and fallback video datasets for offline testing and demo runs. |
| `src/types.ts` | Core Type Contracts | Exports TypeScript interfaces and types for subtitle cues, tracks, speech progress, and settings. |

## Testing & Quality Assurance (`e2e/`, `cypress/`, `scripts/`)

| File Path | Role | Feature & Responsibilities |
|---|---|---|
| `e2e/web.spec.ts` | Playwright Web Test | Tests web demo fixture loading, theme toggling, favorite language controls, and SSR hydration consistency. |
| `e2e/app.spec.ts` | Playwright App Smoke Test | Verifies core UI rendering and table layout integrity. |
| `e2e/emulation.spec.ts` | Android Native Shell Emulation Test | Simulates Android bridge timedtext interception and `tlang` subtitle track retrieval. |
| `scripts/verify-client-spa.ts` | Pure Client SPA Architecture Verification | Validates zero server dependencies, removal of SSR files, and valid client build. |
| `scripts/verify-caption-formats.ts` | Caption Format Verification | Asserts valid JSON3 structure across all repository subtitle fixtures. |
| `scripts/verify-ota-updater.ts` | OTA Updater Test Suite | Tests version comparison, GitHub release artifact resolution, and bundle application. |
| `scripts/verify-audio-track-mode.ts` | Audio-Track Repeat Mode Test Suite | Validates default OFF state, preference persistence, audio track matching, and repeat pipeline. |
| `scripts/verify-auto-scroll.ts` | Auto-Scroll Setting Test Suite | Validates default OFF state, storage persistence, and safe fallback handling. |
| `scripts/verify-hydration.ts` | SSR Hydration Determinism Test | Validates deterministic default language state consistency. |
| `scripts/verify-repo-hygiene.ts` | Repository Hygiene Verification | Asserts absence of synthetic report generators, fake HTML report dashboards, and unignored test artifacts. |
| `scripts/verify-native-captions.ts` | Native Captions & tlang Verification | Asserts valid tlang handling, base language preservation, base64 payload decoding, and Kotlin bridge logic. |
| `scripts/verify-android-favorite-subtitles.ts` | Android Dynamic Subtitles & 10-Line Presentation | Asserts dynamic multi-favorite language track loading, default 10-line presentation per column, and pagination on Android. |
| `scripts/verify-emulation-gh-pages.ts` | Emulation GitHub Pages Publication Test | Asserts workflow permissions, artifact staging, and keep_files deployment configuration for Android emulator artifacts on GitHub Pages. |
| `scripts/verify-android-local-assets.ts` | Android Local Assets Verification | Asserts complete removal of remote web-app fallbacks (APP_URL, github.io) and strict local asset execution in MainActivity.kt. |
| `scripts/verify-favorite-lang-dynamic-fetch.ts` | Dynamic Favorite Languages Fetch Verification | Validates dynamic timedtext subtitle requests via tlang when new favorite languages are selected and merged into tracks. |
| `scripts/verify-network-inspector.ts` | Network Inspector & 50-char Body Verification | Validates 50-character response body truncation, request recording, and inspector UI modal integration. |
| `scripts/verify-md-links.ts` | Markdown Links Checker | Validates that all documentation cross-references and links resolve properly. |
| `scripts/normalize-web-assets.mjs` | Build Asset Normalizer | Adjusts asset paths for GitHub Pages sub-path hosting. |
