# Active Sub-task

## Subtask 30.1: Implement Default Video Subtitles E2E Verification for Android and Demo Web App

- **Goal**:
  1. Implement `scripts/verify-default-video-subtitles-e2e.ts` validating:
     - Demo Web App: validates default video (`L2Ryrr6txwA`) JSON3 subtitles across all supported languages (`en`, `he`, `it`, `es`, `ar`, `ru`), verifies valid cue parsing, timing monotonicity, non-empty text, sentence/word alignment with base language, and multi-language row formatting.
     - Android Shell: validates default video configuration (`DEFAULT_VIDEO_ID` / `DEFAULT_VIDEO_URL`), verifies native caption interceptor parameters for default timedtext and translated `tlang` favorite languages (`he`, `it`), ensures logcat assertions validate `cues >= 1` and `bytes >= 1`, and tests simulated Android environment loading.
  2. Update `scripts/run-android-e2e.sh` and `scripts/android-e2e-assert.sh` to explicitly test and assert that default video subtitles are OK for Android and the demo web app.
  3. Register `test:default-subtitles-e2e` in `package.json` and update `docs/files.md`.
  4. Rebuild Android bundle assets.
  5. Commit the changes and tests before executing them.
  6. Test the changes thoroughly with the dedicated test and present the results for user confirmation.
