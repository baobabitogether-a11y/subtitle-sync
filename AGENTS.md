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

- Break every new prompt into clear tasks and smaller subtasks in `docs/tasks.md`.
- Obtain explicit user confirmation before creating or updating `docs/tasks.md`.
- Obtain explicit user confirmation before creating or updating `docs/todo.md`.
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
- Do not add credentials or invent external service values; document and request anything required.
