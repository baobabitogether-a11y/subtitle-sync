# Active Sub-task

## Subtask 21.1: Dynamically load and present first 10 lines of subtitles for each favorite language on Android

- **Goal**:
  1. In Android mode (`isAndroid`), ensure that when `setObservedTimedTextUrl` captures a valid YouTube caption request, the bridge dispatches `fetchTranslatedCaptionsWithUrl` for all selected favorite languages (`targetLanguages`).
  2. In the Subtitles view, display the first 10 lines of subtitles for each active favorite language column by default, with pagination/limit controls allowing users to expand or navigate.
  3. Ensure the web demo fixture mode remains cleanly scoped without distortion.
  4. Create a dedicated verification script `scripts/verify-android-favorite-subtitles.ts` covering dynamic fetching for all favorite languages and 10-line presentation.
  5. Commit all changes and dedicated tests before executing them, run the test, and present results.



