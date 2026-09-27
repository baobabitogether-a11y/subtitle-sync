# Done tasks

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


