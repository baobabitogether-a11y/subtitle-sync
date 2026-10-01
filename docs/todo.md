# Active Sub-task

## Subtask 27.2: Ensure web demo Languages panel displays all 6 demo languages and verify all test suites

- **Goal**:
  1. In `src/routes/index.tsx`, ensure that on the web demo (`!isAndroid`), the Languages table displays all 6 available demo languages from `LANGS` (sorted according to `languageOrder`), satisfying `e2e/web.spec.ts` line 16 (`toHaveCount(6)`).
  2. On Android (`isAndroid`), keep the behavior focused on the user's selected favorite languages with dynamic `tlang` subtitle loading.
  3. Rebuild the Android web bundle assets in `android-shell/app/src/main/assets/`.
  4. Add dedicated assertions in a verification test ensuring web environment presents 6 rows in the Languages panel table while Android presents user-selected favorite languages.
  5. Run all test suites, compile, and lint.
