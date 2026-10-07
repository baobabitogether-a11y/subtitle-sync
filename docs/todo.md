# Active Sub-task

## Subtask 40.1: Implement Android back navigation and router/browser history integration

- **Goal**:
  1. Inspect `MainActivity.kt` in `android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt`:
     - Implement proper back button handling using AndroidX `OnBackPressedCallback` or `onBackPressedDispatcher`:
       - If modal/inspector is open, notify webview / evaluate JS or pop state.
       - If `webView.canGoBack()`, navigate back with `webView.goBack()`.
       - Otherwise delegate to default back press behavior (exit app).
  2. In the React app (`src/routes/index.tsx` / `src/utils/urlStateManager.ts`):
     - Ensure video changes and modal openings push or manage browser history entries (`window.history.pushState` / `popstate` listener).
     - When user or Android back button triggers `popstate`, handle closing open modals (like `NetworkRequestsInspector` or `ApkReleaseModal`) or restoring previous video ID from URL search params.
  3. Create dedicated verification test `scripts/verify-android-back-navigation.ts` and add script `test:back-navigation` to `package.json`.
  4. Register new test in `docs/files.md`.
  5. Commit changes and tests before executing them (`git commit` and try `git push`).
  6. Test thoroughly with dedicated test, build Android assets, compile, and lint.
  7. Advance to the next task.
