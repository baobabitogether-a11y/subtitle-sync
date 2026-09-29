# Active Sub-task

## Subtask 23.1: Permanently eliminate all remote web-app URLs and fallbacks from `MainActivity.kt` and guarantee local asset execution

- **Goal**:
  1. In `MainActivity.kt`:
     - Delete `APP_URL` constant.
     - Delete any references to remote web-app hosts (`github.io`).
     - In `onCreate` and `onNewIntent`, unconditionally load `https://appassets.androidplatform.net/$querySuffix`.
     - In `shouldOverrideUrlLoading`, only keep `appassets.androidplatform.net` and YouTube embeds inside the WebView, delegating all other external links to system browser.
     - If local `assets.open("index.html")` fails, render an authentic offline local HTML message rather than connecting to any remote server.
  2. In `scripts/verify-android-local-assets.ts`:
     - Assert `APP_URL` is completely absent from `MainActivity.kt`.
     - Assert `github.io` is absent from `MainActivity.kt`.
     - Assert `appassets.androidplatform.net` is the exclusive host used for loading the web-app.
     - Assert `android-shell/app/src/main/assets/index.html` exists and contains genuine production assets.
  3. Register `"test:local-assets"` in `package.json` and document `scripts/verify-android-local-assets.ts` in `docs/files.md`.
  4. Run dedicated test and entire verification suite.
