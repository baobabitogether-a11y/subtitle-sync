# Tasks

## Task 21: Android dynamic subtitle fetching and 10-line presentation for favorite languages

- [ ] **Subtask 21.1: Dynamically load and present first 10 lines of subtitles for each favorite language on Android**: Ensure that in Android mode, intercepted caption base requests dynamically fetch subtitle tracks via `fetchTranslatedCaptionsWithUrl` with `tlang` for every selected favorite language, and present the first 10 lines of subtitles synchronously across each favorite language column with controls to display additional lines. Keep web demo fixtures cleanly scoped. Add dedicated verification tests, commit before execution, test, and verify.

## Task 20: Remove synthetic report generators, fake artifact scripts, and generated HTML files

- [x] **Subtask 20.1: Remove synthetic report generators, fake artifact scripts, and generated HTML files**: Delete `scripts/generate-android-report.mjs`, `scripts/prepare-report.mjs`, `scripts/verify-reports-integrity.mjs`, `android-emulator-report.html`, `cypress/runner-template.html`, and `cypress/reports/`. Clean up `package.json` scripts, update `.github/workflows/deploy-demo.yml` to deploy real `dist/`, update `docs/files.md`, and verify all authentic tests and builds pass.

## Task 19: Remove server dependencies and convert to pure client SPA

- [x] **Subtask 19.1: Remove server dependencies and convert to pure client SPA**: Remove `@tanstack/react-start`, `nitro`, `src/server.ts`, and `src/start.ts`, convert to pure client SPA with Vite (`index.html`), update build and preview scripts, update inventory in `docs/files.md`, add a dedicated test for pure client SPA architecture, commit before execution, test, and verify.

## Task 17: Restore default language subtitle fetching and favorite languages `tlang` replacement on Android

- [x] **Subtask 17.1: Restore default language subtitle fetching and favorite languages `tlang` replacement on Android**: When observing the network request for default subtitles, ensure the default language track is preserved/fetched without an invalid `tlang`, and replace `tlang` with each favorite language's code to fetch all favorite languages as implemented in `mostuf2556/Youtubenet6`. Add dedicated tests, commit before execution, test, and verify.

## Task 18: Fix SSR-Client hydration mismatch in `targetLanguages`

- [x] **Subtask 18.1: Synchronize SSR and Client initial render for `targetLanguages` and dynamic client-only state**: Ensure initial server rendering and client hydration pass share the deterministic default state without accessing client-only localStorage before mount, deferring localStorage synchronization to post-hydration. Add dedicated regression test, commit before execution, test, and verify.

## Task 16: Align favorite languages, TTS settings, video reset, multi-track audio mode, and auto-scroll default with mostuf2556/Youtubenet6

- [x] **Subtask 16.1: Favorite languages and main screen controls**: Expose favorite/desired languages selector on web demo (fixture tracks) and Android (catalog with `tlang` fetching). On the main screen, present only favorite languages for show/hide, speech toggles, ordering, and per-language TTS speech rate and voice selection.
- [x] **Subtask 16.2: Clear columns on new video on Android**: When loading a video other than the default video on Android, clear existing subtitle tracks and columns before fetching fresh subtitles for all favorite languages.
- [x] **Subtask 16.3: YouTube multi-audio track repeat mode**: Add an option to switch to "Audio-track mode" (repeating video segments with the native audio track for supported languages instead of synthesized TTS). Default this option to OFF.
- [x] **Subtask 16.4: Disable auto-focus and scroll by default**: Change "Auto-focus and scroll to current subtitle" (`autoScroll`) to default to `false` (off).
- [x] **Subtask 16.5: E2E testing & verification**: Update and verify test suites (`e2e/web.spec.ts`, `e2e/app.spec.ts`, `e2e/emulation.spec.ts`), commit before testing, and run `npm run build`, `npm run lint`, and integrity tests.
