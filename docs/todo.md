# Active Sub-task

## Subtask 22.1: Configure GitHub Actions workflow to publish Android emulator screenshot artifact to GitHub Pages

- **Goal**:
  1. Update `.github/workflows/emulation.yml` to stage the captured `android-emulator-screenshot.png` (and optionally logcat) into a designated `gh-pages` deployment directory (e.g. `screenshots/android-emulator-screenshot.png`).
  2. Add a deployment step using `peaceiris/actions-gh-pages@v4` with `keep_files: true` targeting the `gh-pages` branch, active when the workflow runs on `main` or `master` or via `workflow_dispatch`.
  3. Ensure no static screenshots or synthetic files are committed to the repository, maintaining 100% adherence to repository hygiene (`npm run test:hygiene`).
  4. Create a dedicated verification script `scripts/verify-emulation-gh-pages.ts` and add `"test:emulation-gh-pages"` to `package.json` to validate the workflow file syntax, action configuration, permissions, target branch, and keep_files parameters.
  5. Update `docs/files.md` with any new files.
  6. Execute the dedicated test and verify all repository checks pass.
