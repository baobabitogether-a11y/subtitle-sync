# Active Sub-task

## Subtask 28.1: Import architectural specification and design contracts from `mostuf2556/Youtubenet6` and fix Markdown link checker

- **Goal**:
  1. Import the 9 missing architectural specification and design contracts from `mostuf2556/Youtubenet6` into `docs/operations/`, `docs/specifications/`, and `docs/designs/`:
     - `docs/operations/ACTIONS.md`
     - `docs/specifications/LIBRARY.md`
     - `docs/designs/DESIGN_SUBTITLE_VIEWS.md`
     - `docs/designs/DESIGN_VIEW_LANGS.md`
     - `docs/designs/DESIGN_CONTROLS_VIEW.md`
     - `docs/designs/DESIGN_PLAYER_PROVIDER.md`
     - `docs/designs/DESIGN_STATE_COORDINATOR.md`
     - `docs/specifications/SCHEMA_TIMEDTEXT.md`
     - `docs/operations/DEBUG.md`
  2. Fix the regex in `scripts/verify-md-links.ts` so that links containing inline code formatting (e.g. `[`**`ACTIONS.md`**`](./docs/operations/ACTIONS.md)`) are accurately captured and checked for target existence.
  3. Update `docs/files.md` to register the new documentation contracts.
  4. Run `npm run test:md` and verify that all relative links resolve cleanly with 0 errors.
