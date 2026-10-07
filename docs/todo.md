# Active Sub-task

## Subtask 47.1: Synchronize README.md links and badges with validated live reports (`mostuf2556/Youtubenet6`)
- Update `README.md` to point GitHub Pages links and workflow badges to the validated live reports (`https://mostuf2556.github.io/Youtubenet6/` and associated Mochawesome, Playwright, and Android emulator endpoints).
- Update `scripts/update-readme.mjs` default target repository to `Youtubenet6`.
- Update `scripts/verify-readme-links.ts` and `scripts/verify-e2e-report-links.ts` to validate the live `Youtubenet6` report URLs.
- Run and pass all verification tests (`test:readme-links`, `test:e2e-report-links`, `test:hotfix`, `test:doc-contracts`, `test:md`).
