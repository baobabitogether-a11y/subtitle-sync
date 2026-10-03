# Active Sub-task

## Subtask 41.1: Implement Video Library / Watch History panel

- **Goal**:
  1. Add `library` panel to `PANELS` in `src/routes/index.tsx` (or dedicated modular component `src/components/VideoLibraryPanel.tsx`).
  2. Implement persistent video watch history in `localStorage` under `yt_video_library_v2`:
     - Tracks video ID, title, timestamp, thumbnail URL (`https://i.ytimg.com/vi/${id}/mqdefault.jpg`), and original URL.
     - Automatically saves current video into library when played or loaded.
     - Seeds with default educational/demo items if empty (matching `appConfig.ts` / `mostuf2556/Youtubenet6`).
  3. Provide UI controls in the Library panel:
     - Search / filter input by video title or ID.
     - Thumbnail preview, title, formatted date/time, and video ID badge.
     - "Load Video" action that switches player to the selected video and updates history.
     - "Remove" action to delete individual videos from the library.
     - "Clear Library" action with confirmation.
     - "Save Current Video" button to manually add or update the current active video.
     - Test IDs and accessibility attributes: `#video-library-panel`, `data-testid="video-library-panel"`, `data-testid="library-search-input"`, `data-testid="library-item-${id}"`, etc.
  4. Create dedicated verification test `scripts/verify-video-library-panel.ts` validating:
     - Panel presence in `PANELS` and UI rendering.
     - Persistence in `localStorage` (`yt_video_library_v2`).
     - Adding, switching/loading, and removing items.
     - Thumbnail and metadata generation.
  5. Register test in `package.json` (`test:video-library`) and `docs/files.md`.
  6. Verify compilation (`compile_applet`) and zero lint warnings (`lint_applet`).
  7. Run all tests and present results for user confirmation.
