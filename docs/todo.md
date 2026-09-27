# Active Sub-task

## Subtask 17.1: Restore default language subtitle fetching and favorite languages `tlang` replacement on Android

- **Goal**:
  1. Fix the Android app so it fetches and displays subtitles for the default language.
  2. After observing the network request for the default subtitles, replace the `tlang` parameter with the favorite languages' language codes and fetch them as well (matching `mostuf2556/Youtubenet6`).
- **Implementation**:
  - In `MainActivity.kt` (`executeTimedTextRepetition`):
    - When `targetLang` matches the URL's original `lang` parameter (the default language), do not append a `tlang` query parameter (or remove any existing `tlang`), ensuring YouTube returns the native/default language caption without 400 bad request error.
    - When `targetLang` is another favorite/desired language, replace or append `tlang` with that language's code, keeping all original query parameters (and applying `fmt` such as `json3`).
  - In `src/routes/index.tsx`:
    - Ensure that when a timedtext URL is intercepted, both the default language (`lang`) and all favorite languages (`targetLanguages`) are included in `selected`.
    - Also ensure `shown` includes the default language and favorite languages so that columns are not hidden.
    - In `cols`, ensure the default language and favorite languages with loaded tracks are shown.
  - In `e2e/emulation.spec.ts` & dedicated test script `scripts/verify-default-and-favorite-captions.ts`:
    - Test that the default language track is requested/loaded and that each favorite language has its `tlang` replaced and fetched.
  - Commit changes and tests before running verification.
  - Test thoroughly, lint, and compile.
