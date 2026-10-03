# Active Sub-task

## Subtask 33.1: Implement progressive / non-blocking subtitle loading technique

- **Goal**:
  1. Integrate `React.useTransition` (`startSubtitlesTransition` and `isSubtitlesPending`) into `src/routes/index.tsx` for non-blocking subtitle track updates.
  2. Implement progressive stream loading in `fetchFavoriteLanguageSubtitles`: as each language finishes fetching via the native bridge, stream it immediately into tracks state inside a transition so users see subtitles appear incrementally.
  3. Yield to the browser event loop (`setTimeout(..., 0)`) between language fetches to prevent main thread starvation.
  4. Wrap live intercepted base64 captions and web fixture loading in non-blocking transitions so player playback, seeks, and UI interactions maintain 60 FPS.
  5. Add visual progressive loading indicator to subtitles header when `isSubtitlesPending` is active.
  6. Add dedicated verification test `scripts/verify-progressive-subtitles-loading.ts` (`npm run test:progressive-subtitles`).
  7. Commit changes and tests before executing them (`git commit` and try `git push`).
  8. Test changes thoroughly with dedicated test and regression suites, compile and lint.
  9. Present results and obtain user confirmation.
