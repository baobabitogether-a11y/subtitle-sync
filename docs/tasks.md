# Tasks

## Task 9: Fix repository name across the application from Youtubenet6 to subtitle-sync

- [ ] Update `MainActivity.kt` APP_URL fallback to `https://mostuf2556.github.io/subtitle-sync/app/`.
- [ ] Update `src/utils/apkUpdater.ts` repository constants (`DEFAULT_REPO`, `FALLBACK_REPO`) and update script curl URLs to `mostuf2556/subtitle-sync`.
- [ ] Update `scripts/update-readme.mjs` default target repo to `subtitle-sync`.
- [ ] Update `README.md` workflow badges, links, live web demo URL, and curl installation commands to reference `mostuf2556/subtitle-sync`.
- [ ] Update `update.apk.sh` and `install-apk.sh` to target `subtitle-sync`.
- [ ] Update `scripts/verify-ota-updater.ts` test URLs to reflect `subtitle-sync`.
- [ ] Verify test suite passes (`verify-ota-updater`, `verify-md-links`, `verify-caption-formats`, `verify-reports-integrity`, and app build).
