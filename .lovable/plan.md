# Why the Android app loads in Youtubenet6 but not here

## Diagnosis

Both repos use the same Android shell. It reads the web files packed inside the APK from `https://appassets.androidplatform.net` with `WebViewAssetLoader.AssetsPathHandler`. That handler hands back the exact file it's asked for and has no fallback to `index.html`.

- **Youtubenet6** loads `https://appassets.androidplatform.net/index.html` (seen when the upstream `MainActivity.kt` was read earlier). It asks for a real file, so the page opens.
- **This repo** changed that call to `https://$LOCAL_ASSET_DOMAIN/$querySuffix` (MainActivity.kt lines 273 and 295). That asks for `/`, which is not a file in the APK. The loader finds nothing, and the WebView shows a blank or error page.

This repo's router already strips `/index.html` from the address when the app starts (`src/router.tsx`), so loading `index.html` directly works with the current views.

Other things to check (lower risk; confirm during the fix):
- `index.html` points to `/favicon.ico` with a leading slash. `normalize-web-assets.mjs` already rewrites it.
- The `verify-android-local-assets.ts` test requires the broken `/$querySuffix` form. It needs updating, or it will keep the bug in place.
- Android assets are gitignored. The APK only has the web app when CI or Gradle `preBuild` runs `build:android-assets`.

## Fix

1. In `MainActivity.kt`, load `https://$LOCAL_ASSET_DOMAIN/index.html$querySuffix` both at startup and for shared links, as Youtubenet6 does.
2. Update `scripts/verify-android-local-assets.ts` to expect `index.html`. Also make it check that the built `dist/index.html` uses only relative `./assets/` paths.
3. Run `npm run build` and confirm that `dist/index.html` and its `./assets/*` files exist and resolve.
4. Check on a device or emulator with the release workflow or `scripts/run-android-e2e.sh`. The logcat line should show `.../index.html` and the app should render.
