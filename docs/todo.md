# Active Sub-task

## Subtask 46.1: Implement Android Version Bump CLI Script (`scripts/bump-android-version.ts`)

- **Goal**:
  1. Implement CLI script `scripts/bump-android-version.ts` that:
     - Reads and parses current `versionCode` (int) and `versionName` (semver string) from `android-shell/app/build.gradle.kts`.
     - Supports CLI arguments: `patch` (default), `minor`, `major`, explicit version (e.g. `1.1.0`), and explicit code (e.g. `--code 42`).
     - Safely increments `versionCode` (e.g. `1 -> 2`).
     - Updates `versionName` (e.g. `1.0 -> 1.0.1` or `1.0.0 -> 1.0.1`).
     - Updates `package.json` `version` to stay in sync with `versionName`.
     - Supports `--dry-run` to preview changes without writing.
  2. Add `version:bump` script to `package.json`.
  3. Validate compilation, build, and linting.
  4. Commit changes and verify before moving to Subtask 46.2.
