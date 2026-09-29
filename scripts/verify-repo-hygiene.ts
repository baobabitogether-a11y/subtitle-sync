import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Repository Hygiene & Authenticity Test");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Assert synthetic report generator scripts do not exist
const forbiddenScripts = [
  "scripts/generate-android-report.mjs",
  "scripts/prepare-report.mjs",
  "scripts/verify-reports-integrity.mjs",
];

for (const script of forbiddenScripts) {
  const fullPath = path.join(rootDir, script);
  assert(!fs.existsSync(fullPath), `Synthetic report script must NOT exist: ${script}`);
  console.log(`✅ PASS: Forbidden script absent: ${script}`);
}

// 2. Assert synthetic HTML report files and templates do not exist
const forbiddenFiles = [
  "android-emulator-report.html",
  "cypress/runner-template.html",
  "cypress/reports",
  "playwright-report",
];

for (const file of forbiddenFiles) {
  const fullPath = path.join(rootDir, file);
  assert(!fs.existsSync(fullPath), `Synthetic report file/dir must NOT exist: ${file}`);
  console.log(`✅ PASS: Forbidden file/dir absent: ${file}`);
}

// 3. Assert root directory contains no unexpected HTML files other than index.html
const rootItems = fs.readdirSync(rootDir);
const htmlFiles = rootItems.filter((f) => f.endsWith(".html"));
assert.deepStrictEqual(
  htmlFiles,
  ["index.html"],
  `Root must only contain index.html, found: ${htmlFiles.join(", ")}`,
);
console.log("✅ PASS: Root directory contains only genuine index.html entry point");

// 4. Assert package.json has no synthetic report scripts
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
assert(!pkg.scripts["test:android:report"], "package.json must not have test:android:report");
assert(!pkg.scripts["test:report:integrity"], "package.json must not have test:report:integrity");
console.log("✅ PASS: package.json is free of synthetic report generation scripts");

console.log("====================================================");
console.log("📊 REPOSITORY HYGIENE TEST: All tests passed!");
console.log("====================================================");
