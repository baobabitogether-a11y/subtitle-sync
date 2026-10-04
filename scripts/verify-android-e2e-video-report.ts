import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("====================================================");
console.log("🧪 Starting Android Emulator E2E Video & Report Test");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify AGENTS.md specification
const agentsPath = path.join(rootDir, "AGENTS.md");
assert(fs.existsSync(agentsPath), "AGENTS.md must exist");
const agentsContent = fs.readFileSync(agentsPath, "utf8");
assert(
  agentsContent.includes("E2E on Android emulator: end-to-end testing on the Android emulator runs exclusively within GitHub Actions"),
  "AGENTS.md must specify that Android emulator E2E runs exclusively in GitHub Actions workflows",
);
assert(
  agentsContent.includes("gh-pages"),
  "AGENTS.md must specify that test outputs and video recordings are available only on gh-pages branch",
);
console.log("✅ PASS: AGENTS.md specifies GitHub Actions emulator exclusivity and gh-pages artifact deployment");

// 2. Verify scripts/run-android-e2e.sh
const runE2EPath = path.join(rootDir, "scripts/run-android-e2e.sh");
assert(fs.existsSync(runE2EPath), "scripts/run-android-e2e.sh must exist");
const runE2EContent = fs.readFileSync(runE2EPath, "utf8");
assert(
  runE2EContent.includes("adb shell screenrecord"),
  "run-android-e2e.sh must trigger screenrecord",
);
assert(
  runE2EContent.includes("android-emulator-e2e.mp4"),
  "run-android-e2e.sh must configure output to android-emulator-e2e.mp4",
);
assert(
  runE2EContent.includes("Skipping live device execution locally per AGENTS.md rule"),
  "run-android-e2e.sh must gracefully skip local execution when no emulator is connected",
);
console.log("✅ PASS: scripts/run-android-e2e.sh records screen and gracefully handles local environment");

// 3. Verify .github/workflows/emulation.yml
const emulationPath = path.join(rootDir, ".github/workflows/emulation.yml");
assert(fs.existsSync(emulationPath), ".github/workflows/emulation.yml must exist");
const emulationContent = fs.readFileSync(emulationPath, "utf8");
assert(
  emulationContent.includes("adb shell screenrecord"),
  "emulation.yml must start screenrecord during emulator script",
);
assert(
  emulationContent.includes("android-emulator-e2e.mp4"),
  "emulation.yml must pull and upload android-emulator-e2e.mp4",
);
assert(
  emulationContent.includes("gh-pages-staging/screenshots/android-emulator-e2e.mp4"),
  "emulation.yml must stage android-emulator-e2e.mp4 for gh-pages deployment",
);
assert(
  emulationContent.includes("trap capture_outputs EXIT") &&
    emulationContent.includes("bash scripts/android-e2e-assert.sh || TEST_STATUS=$?") &&
    emulationContent.includes("adb logcat -d -v time > ./android-emulator-logcat.txt"),
  "emulation.yml must collect screenshot, recording, and logcat outputs even when the E2E assertion fails",
);
assert(
  emulationContent.includes("peaceiris/actions-gh-pages@v4"),
  "emulation.yml must deploy artifacts to gh-pages branch",
);
console.log("✅ PASS: .github/workflows/emulation.yml records video and publishes to GitHub Pages branch");

// 4. Verify .gitignore ignores mp4 video files
const gitignorePath = path.join(rootDir, ".gitignore");
assert(fs.existsSync(gitignorePath), ".gitignore must exist");
const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
assert(
  gitignoreContent.includes("android-emulator-e2e.mp4"),
  ".gitignore must ignore android-emulator-e2e.mp4",
);
assert(
  gitignoreContent.includes("*.mp4"),
  ".gitignore must ignore *.mp4",
);
console.log("✅ PASS: .gitignore keeps main branch clean of video files");

// 5. Verify README.md links
const readmePath = path.join(rootDir, "README.md");
assert(fs.existsSync(readmePath), "README.md must exist");
const readmeContent = fs.readFileSync(readmePath, "utf8");
assert(
  readmeContent.includes("screenshots/android-emulator-e2e.mp4"),
  "README.md must link to the Android Emulator E2E Video",
);
assert(
  readmeContent.includes(
    "[**Open Latest Emulator E2E Report**](https://github.com/mostuf2556/subtitle-sync/blob/gh-pages/android-emulator-report.md)",
  ),
  "README.md must link to the published latest emulator report",
);
console.log("✅ PASS: README.md links to the Android Emulator E2E Video on GitHub Pages");

console.log("====================================================");
console.log("🎉 All Android Emulator E2E Video & Report tests PASSED!");
console.log("====================================================");
