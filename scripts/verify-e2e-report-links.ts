import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Dedicated E2E Report Links Verification");
console.log("====================================================");

const rootDir = process.cwd();
const readmePath = path.resolve(rootDir, "README.md");
assert(fs.existsSync(readmePath), "README.md must exist in root");

const readme = fs.readFileSync(readmePath, "utf8");

// 1. Verify E2E Reports Section exists in README.md
assert(
  readme.includes("## 🌐 GitHub Pages Links"),
  "README.md must contain ## 🌐 GitHub Pages Links section",
);
console.log("✅ PASS: GitHub Pages Links section present in README.md");

// 2. Verify Mochawesome E2E Test Report Link
const mochawesomeMatch = readme.match(
  /\[\*\*Open Mochawesome Report\*\*\]\((https:\/\/[^/]+\.github\.io\/[^/]+\/mochawesome\.html)\)/,
);
assert(
  mochawesomeMatch,
  "README.md must contain [**Open Mochawesome Report**] link pointing to mochawesome.html",
);
console.log(`✅ PASS: Mochawesome report link verified: ${mochawesomeMatch[1]}`);

// 3. Verify Playwright E2E Test Report Link
const playwrightMatch = readme.match(
  /\[\*\*Open Playwright Report\*\*\]\((https:\/\/[^/]+\.github\.io\/[^/]+\/playwright\/index\.html)\)/,
);
assert(
  playwrightMatch,
  "README.md must contain [**Open Playwright Report**] link pointing to playwright/index.html",
);
console.log(`✅ PASS: Playwright report link verified: ${playwrightMatch[1]}`);

// 4. Verify Android Emulator E2E Test Report Link
const emulatorReportMatch = readme.match(
  /\[\*\*Open Android Emulator Report\*\*\]\((https:\/\/[^/]+\.github\.io\/[^/]+\/android-emulator-report\.html)\)/,
);
assert(
  emulatorReportMatch,
  "README.md must contain [**Open Android Emulator Report**] link pointing to android-emulator-report.html",
);
console.log(`✅ PASS: Android Emulator report link verified: ${emulatorReportMatch[1]}`);

// 5. Verify Android Emulator Screenshot Link
const screenshotMatch = readme.match(
  /\[\*\*View Latest Emulator Screenshot\*\*\]\((https:\/\/[^/]+\.github\.io\/[^/]+\/screenshots\/android-emulator-screenshot\.png)\)/,
);
assert(
  screenshotMatch,
  "README.md must contain [**View Latest Emulator Screenshot**] link pointing to android-emulator-screenshot.png",
);
console.log(`✅ PASS: Emulator screenshot link verified: ${screenshotMatch[1]}`);

// 6. Verify CI Workflow Links
assert(
  readme.includes("actions/workflows/web.yml"),
  "README.md must link to Web E2E CI workflow actions/workflows/web.yml",
);
assert(
  readme.includes("actions/workflows/emulation.yml"),
  "README.md must link to Android Emulation CI workflow actions/workflows/emulation.yml",
);
console.log("✅ PASS: Live CI workflows for Web E2E and Emulation E2E linked in README.md");

// 7. Verify workflows stage these report artifacts
const webWorkflow = fs.readFileSync(path.resolve(rootDir, ".github/workflows/web.yml"), "utf8");
assert(
  webWorkflow.includes("Stage Playwright Report for GitHub Pages") ||
    webWorkflow.includes("playwright"),
  "web.yml must stage Playwright report for publication",
);

const emulationWorkflow = fs.readFileSync(
  path.resolve(rootDir, ".github/workflows/emulation.yml"),
  "utf8",
);
assert(
  emulationWorkflow.includes("android-emulator-report.html"),
  "emulation.yml must generate and stage android-emulator-report.html",
);
console.log("✅ PASS: Workflows configured to stage and publish all linked E2E reports");

console.log("====================================================");
console.log("🎉 Dedicated E2E Report Links Verification PASSED!");
console.log("====================================================");
