# Active Sub-task

## Subtask 46.3: Ensure Guaranteed E2E Report Staging on GitHub Pages
- Update `web.yml` and `deploy-demo.yml` to stage and publish Mochawesome, Playwright, and Android reports with resilient deployment steps (`if: always() && ...`).
- In `deploy-demo.yml`, bundle or preserve E2E reports from previous runs or gh-pages branch so deploying the demo web app does not erase test reports.
- In `web.yml`, ensure Playwright report (`cypress/reports/playwright/index.html`) and Mochawesome report are staged and deployed to `gh-pages`.
- Update dedicated verification tests in `scripts/verify-e2e-report-links.ts` to assert resilient staging across `web.yml`, `deploy-demo.yml`, and `emulation.yml`.
