# Tasks

## Task 31: Update AGENTS.md — after git commit, try using git push

- [x] **Subtask 31.1: Update AGENTS.md with git push instruction and verify git push attempt handling**: Update AGENTS.md under Work tracking to specify that after performing a git commit, attempt `git push` (handling failure gracefully if no remote or credentials configured). Add dedicated test to verify this rule and workflow integrity.

## Task 32: Fix YouTube link sharing to Android app

- [ ] **Subtask 32.1: Fix Android intent handling & WebView URL query propagation for shared YouTube links**: Diagnose and fix why sharing a YouTube URL/intent to Android keeps showing the default video. Ensure MainActivity intent filters, extras (`Intent.EXTRA_TEXT`), query parameter extraction (`v=` or `youtu.be/` video ID), and WebView local asset URL generation (`index.html?v=...`) reliably update React app state and switch to the shared video. Add dedicated verification test.

## Task 33: Optimize subtitle loading and fetching performance

- [ ] **Subtask 33.1: Implement progressive / non-blocking subtitle loading technique**: Ensure subtitle parsing and network fetching do not block or stutter the UI/player, employing progressive chunked loading, idle callbacks, or microtask batching. Add dedicated performance verification test.

## Task 34: Debug mode toggle controlling Network Panel visibility

- [ ] **Subtask 34.1: Add debug mode toggle (default false) and hide network panel when debug mode is disabled**: Allow using the app without the network panel. Add a settings toggle for debug mode, defaulting to `false`. Add dedicated verification test.

## Task 35: Support running Android app in the background

- [ ] **Subtask 35.1: Configure Android WebView & lifecycle to prevent pausing playback when app is not active**: Ensure WebView does not pause media on pause/background (`setMediaPlaybackRequiresUserGesture(false)`, background audio flags, keeping WebView active in onPause/onStop where appropriate). Add dedicated verification test.

## Task 36: Ensure sync between language views with auto-fetch-retry

- [ ] **Subtask 36.1: Synchronize favorites view, language selection, and subtitles view with auto-fetch-retry**: Ensure every favorite language is consistently present in the subtitles view. If a favorite language track fails or is missing, automatically trigger auto-fetch-retry until aligned. Add dedicated verification test.

## Task 37: Clean Network Panel records & add green badge indicator for good fetching

- [ ] **Subtask 37.1: Exclude empty response bodies from Network Panel and add green badge indicator**: Do not list requests with no response body as successful. Ensure HTTP status reflects actual responses. Add green badge indicator for successfully fetched languages. Add dedicated verification test.

## Task 38: Accelerate app performance & enhance Network Panel with accordion and status tags

- [ ] **Subtask 38.1: Implement performance optimizations and per-record Network Panel accordion with tlang color tags**: Add memoization/rendering optimizations. Enhance Network Panel with accordion per record and tlang tags with status colors (pending: orange, done: green, failed: red, overridden by green on retry success). Add dedicated verification test.

## Task 39: Allow closing the Network Panel

- [ ] **Subtask 39.1: Provide explicit close / collapse control on Network Panel**: Allow users to close the network panel easily via close button, escape key, or backdrop click. Add dedicated verification test.

## Task 40: Support app history (Android back navigation)

- [ ] **Subtask 40.1: Implement Android back navigation and router/browser history integration**: Support Android back button events (`onBackPressed` / WebView `canGoBack()` or React popstate) to navigate back through viewed videos and panels instead of exiting immediately. Add dedicated verification test.

## Task 41: Video library panel (watch history)

- [ ] **Subtask 41.1: Implement Video Library / Watch History panel**: Maintain a persistent history of played YouTube videos (ID, title, timestamp, thumbnail) with quick reload / selection. Add dedicated verification test.

## Task 42: Remove subtitle caching

- [ ] **Subtask 42.1: Remove subtitle caching from app to simplify data flow**: Eliminate caching layers for subtitles (`subtitleCache.ts`, etc.) so subtitles are freshly retrieved without cache invalidation issues. Add dedicated verification test.
