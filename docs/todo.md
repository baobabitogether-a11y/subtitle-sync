# Active Sub-task

## Subtask 47.2: Ensure GitHub Actions E2E Tests Pass and Deploy to GitHub Pages on Forked Repos

- Add `push: branches: [main, master]` triggers to `web.yml` and `emulation.yml` in addition to `workflow_run` so forks automatically run CI and publish to `gh-pages`.
- Verify `web.yml`, `deploy-demo.yml`, and `emulation.yml` deploy all reports (`mochawesome.html`, `playwright/`, `android-emulator-report.html`, `screenshots/`) to `gh-pages` with `keep_files: true`.
- Run all E2E test suites locally and verify app compilation and linting.



