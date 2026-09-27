# Current task

## Task 10: Fix blank screen on Android & GitHub Pages demo and fix CI workflow package-lock failure

- Configure dynamic basepath detection and trailing slash/index.html normalization in `src/router.tsx`.
- Add defensive Web Speech API checks and hook native Android TTS in `src/routes/index.tsx`.
- Update fixture paths in `src/routes/index.tsx` to support GitHub Pages subpaths.
- Update `MainActivity.kt` to load the root route without forcing `/index.html` and add navigation checks.
- Commit `package-lock.json` and make registry normalization in GitHub Actions workflows resilient with `test -f package-lock.json`.
- Run `build:android-assets`, `prepare-report.mjs`, and verify all tests.
