# Tasks

## Task 10: Fix blank screen on Android & GitHub Pages demo and fix CI workflow package-lock failure

- [ ] Add dynamic basepath detection (`/subtitle-sync/app`, `/app`, or root) and normalize `/index.html` and trailing slashes in `src/router.tsx` and `src/client.tsx`.
- [ ] Add defensive Web Speech API guards in `src/routes/index.tsx` so missing `speechSynthesis` does not crash React hydration on Android WebView or unsupported environments.
- [ ] Connect Android Native TTS (`AndroidNativeShell.speak` and `stopSpeaking`) in `src/routes/index.tsx`.
- [ ] Fix subtitle fixture fetch path in `src/routes/index.tsx` to respect dynamic basepath under GitHub Pages (`/subtitle-sync/app/fixtures/...`).
- [ ] Update `MainActivity.kt` to load root route `https://appassets.androidplatform.net/$querySuffix` and add WebView navigation guards.
- [ ] Commit `package-lock.json` and make registry normalization in GitHub Actions workflows (`deploy-demo.yml`, `release-apk.yml`, `emulation.yml`, `ci.yml`, `integrity.yml`) safe if `package-lock.json` is missing.
- [ ] Run `build:android-assets`, `prepare-report.mjs`, and verify all tests and applet compilation.
