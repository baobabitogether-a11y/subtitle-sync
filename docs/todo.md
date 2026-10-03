# Active Sub-task

## Subtask 32.1: Fix YouTube link sharing to Android app (resolve intent/query routing bug causing app to stay on default video)

- **Goal**:
  1. Inspect `MainActivity.kt`, `AndroidManifest.xml`, and the client router/app (`src/routes/index.tsx`, `src/router.tsx`, `src/client.tsx`) to identify why sharing a YouTube link (via `ACTION_SEND` or `ACTION_VIEW` intent) keeps showing the default video instead of switching to the shared video.
  2. Align the implementation with `https://github.com/mostuf2556/Youtubenet6`:
     - Ensure `MainActivity.kt` handles both `onCreate` and `onNewIntent` for shared text / YouTube URLs, extracts the YouTube video ID (supporting standard watch URLs `youtube.com/watch?v=...`, short URLs `youtu.be/...`, shorts URLs `youtube.com/shorts/...`, embed URLs, and raw text containing URLs).
     - Ensure the URL loaded into the WebView passes the extracted video ID query parameter properly (e.g. `?v=<videoId>`).
     - Ensure React router and `src/routes/index.tsx` read `v` from window location / query search parameters and update the active video player (`videoId`) and subtitle state, clearing previous video tracks if necessary.
  3. Implement dedicated verification test `scripts/verify-youtube-share-intent.ts` validating:
     - Extraction of video IDs from all YouTube URL formats (standard, shorts, youtu.be, raw query text).
     - Intent routing in `MainActivity.kt` for `ACTION_SEND` (`Intent.EXTRA_TEXT`) and `ACTION_VIEW` (`dataUri`).
     - Web app query parameter synchronization and state update.
  4. Register `test:youtube-share-intent` in `package.json` and document in `docs/files.md`.
  5. Rebuild Android assets.
  6. Commit changes and tests before executing them (`git commit` and try `git push`).
  7. Run dedicated and regression tests, compile and lint.
  8. Present the results and obtain user confirmation.
