# Tasks

## Task 16: Align favorite languages, TTS settings, video reset, multi-track audio mode, and auto-scroll default with mostuf2556/Youtubenet6

- **Subtask 16.1: Favorite languages and main screen controls**: Expose favorite/desired languages selector on web demo (fixture tracks) and Android (catalog with `tlang` fetching). On the main screen, present only favorite languages for show/hide, speech toggles, ordering, and per-language TTS speech rate and voice selection.
- **Subtask 16.2: Clear columns on new video on Android**: When loading a video other than the default video on Android, clear existing subtitle tracks and columns before fetching fresh subtitles for all favorite languages.
- **Subtask 16.3: YouTube multi-audio track repeat mode**: Add an option to switch to "Audio-track mode" (repeating video segments with the native audio track for supported languages instead of synthesized TTS). Default this option to OFF.
- **Subtask 16.4: Disable auto-focus and scroll by default**: Change "Auto-focus and scroll to current subtitle" (`autoScroll`) to default to `false` (off).
- **Subtask 16.5: E2E testing & verification**: Update and verify test suites (`e2e/web.spec.ts`, `e2e/app.spec.ts`, `e2e/emulation.spec.ts`), commit before testing, and run `npm run build`, `npm run lint`, and integrity tests.
