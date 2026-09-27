# Active Sub-task

## Subtask 18.1: Synchronize SSR and Client initial render for `targetLanguages` and dynamic client-only state

- **Goal**: Prevent hydration mismatch error between server render and client mount in `src/routes/index.tsx`.
- **Implementation**:
  - Keep `targetLanguages` initialized to deterministic default during SSR and initial client render without reading differing `localStorage` values during the synchronous render pass.
  - Sync stored user learning languages from `getUserLearningLanguages()` in a `useEffect` on mount.
  - Also ensure other client-stored states (like `autoScroll`, `audioTrackMode`, etc.) avoid hydration discrepancies or suppress hydration warnings on dynamic badge/count elements where appropriate.
  - Add dedicated regression test covering SSR vs client initial language state consistency.
  - Commit changes and tests before running verification.
  - Execute tests and verify clean build and lint.
