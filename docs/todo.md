# Active Sub-task

## Subtask 29.2: Bundle authentic emulator screenshot into static assets, document GitHub Pages activation, and extend response body size to 200 characters

- **Goal**:
  1. Bundle the authentic emulator screenshot asset into `public/screenshots/android-emulator-screenshot.png` and `public/assets/android-emulator-screenshot.png` so it is always present in `dist/` upon build and committed to `gh-pages` by `deploy-demo.yml`.
  2. Extend response body preview limit to 200 characters in `src/utils/networkTracker.ts` (`MAX_RESPONSE_BODY_PREVIEW_CHARS = 200`), update inspector UI modal in `src/components/NetworkRequestsInspector.tsx`, and update test in `scripts/verify-network-inspector.ts`.
  3. Clearly document in `README.md` and `docs/operations/ACTIONS.md` how to activate GitHub Pages under repository settings (`Settings > Pages > Source: Deploy from branch gh-pages / root`) so `https://mostuf25561.github.io/subtitle-sync/` resolves to 200.
  4. Update `scripts/verify-readme-links.ts` to assert that `public/screenshots/android-emulator-screenshot.png` exists.
  5. Rebuild Android bundle assets, execute all test suites, compile, and lint.
