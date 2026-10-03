<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Work tracking

- Follow prompt steps: break every prompt into clear numbered steps and execute them sequentially step after step.
- Git commit each step: perform a dedicated Git commit after completing each section or step to keep progress incremental and transparent.
- After git commit, try using git push: after performing each git commit, attempt `git push` (handling failure gracefully if no remote or push credentials are configured) to keep remote branches and editor synchronized.
- Test each section and commit each step:
  1. Implement the section's changes.
  2. Add or update dedicated tests covering the specific feature requirements.
  3. Test each section thoroughly with the dedicated tests, verify app compilation (`compile_applet` / `npm run build`), and run code verification (`lint_applet` / `npm run lint`).
  4. Commit the verified code changes and tests after each step.
- Check the last GitHub Actions result and fix failed flows: continuously monitor and verify GitHub Actions workflow outcomes (such as `web.yml`, `emulation.yml`, `deploy-demo.yml`, `release-apk.yml`, and `integrity.yml`), diagnose the root cause of any broken or failing CI steps, and fix failed workflows promptly.
- Break every new prompt into clear tasks and smaller subtasks in `docs/tasks.md`.
- Obtain explicit user confirmation before creating or updating `docs/tasks.md` unless explicitly instructed by the user prompt.
- Obtain explicit user confirmation before creating or updating `docs/todo.md` unless explicitly instructed by the user prompt.
- Keep `docs/todo.md` strictly focused: it must always contain only the single active sub-task currently being executed.
- For each sub-task in `docs/todo.md`:
  1. Implement the sub-task's changes.
  2. Add or update dedicated tests covering the specific feature requirements.
  3. Commit the changes and tests before executing them.
  4. Test the changes thoroughly with the dedicated tests after the commit.
  5. Present the results and obtain user confirmation before advancing to the next sub-task.
- To verify any feature, always implement a dedicated test specifically validating the new behavior.
- Move completed sub-tasks from `docs/todo.md` to `docs/done.md` and update `docs/tasks.md` only after receiving explicit user confirmation.

## Code architecture and modularity

- Maintain a documented inventory of files (e.g. in `docs/files.md`), detailing each file's specific role and feature scope.
- Name every code file descriptively according to its exact function and feature responsibility.
- Do not edit or concentrate code exclusively within a single main source file; decompose features, UI components, state management, and business logic into dedicated, modular files.

## Clean repository hygiene and authentic testing

- Keep the repository strictly clean of build products, generated artifacts, and synthetic report files: only genuine source code, configuration files, GitHub Actions workflows, and Markdown documentation (`.md` files) belong in the repository.
- Build outputs (such as `dist/`, compiled assets, and runtime caches) must remain ephemeral and ignored, never committed into the source tree.
- Do not add or maintain hardcoded report generators, fabricated HTML presentation dashboards, or synthetic artifact creators (e.g. placeholder video generators or fake test result HTML pages).
- All end-to-end (E2E) and integration tests must validate real application source code and dynamic runtime execution directly; tests must assert genuine component behaviors, state transitions, and actual data flows rather than relying on hardcoded strings or synthetic report templates.

## Project-specific delivery

- This project should remain identical in architecture, tooling, workflows, scripts, and conventions to [mostuf2556/Youtubenet6](https://github.com/mostuf2556/Youtubenet6), with deliberate differences limited strictly to the views and the subtitles parser.
- For every issue, bug, or configuration discrepancy encountered, inspect and compare against the corresponding solution implemented in `https://github.com/mostuf2556/Youtubenet6`.
- Preserve the existing application stack and repository structure.
- Keep GitHub Actions, GitHub Pages reports, the web demo, and Android emulator coverage working together.
- E2E on Android emulator: end-to-end testing on the Android emulator runs exclusively within GitHub Actions workflow operations (not in local environment test runs) and produces artifacts (test outputs, logs, and video screen recordings) to be available exclusively on the GitHub Pages branch (`gh-pages`), never committed to the main branch.
- GitHub Pages report: should produce a video of the e2e test running on android emulator and present it on github pages along the e2e reports for web and emulator/device and the demo web app (the video and other build outputs should not exist on the main branch).
- Do not add credentials or invent external service values; document and request anything required.
