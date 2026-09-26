# Current task

## Task 6: Fix CI dependency installation and Android startup

The Docker Playwright image currently fails before tests because its newer npm rejects optional-platform lockfile metadata. The Android shell also falls back to a 404 remote URL when an APK is built without generated assets.

## Done looks like

- Docker E2E dependency installation reaches Playwright.
- Android builds generate web assets when `src/main/assets/index.html` is absent.
- GitHub Pages fallback assets resolve under the deployed subpath.