import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Dedicated Playwright Panel Locators Test");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify e2e/web.spec.ts does not use ambiguous locator('details').filter({ hasText: 'Languages' })
const webSpecPath = path.resolve(rootDir, "e2e/web.spec.ts");
assert(fs.existsSync(webSpecPath), "e2e/web.spec.ts must exist");
const webSpec = fs.readFileSync(webSpecPath, "utf8");

assert(
  !webSpec.includes('page.locator("details").filter({ hasText: "Languages" })'),
  "e2e/web.spec.ts must not use ambiguous locator('details').filter({ hasText: 'Languages' })",
);
assert(
  webSpec.includes('has: page.locator("summary", { hasText: "Languages" })'),
  "e2e/web.spec.ts must disambiguate Languages panel via summary header",
);
console.log("✅ PASS: e2e/web.spec.ts uses disambiguated Languages panel locators");

// 2. Verify e2e/app.spec.ts does not use ambiguous locator('details').filter({ hasText: 'Languages' })
const appSpecPath = path.resolve(rootDir, "e2e/app.spec.ts");
assert(fs.existsSync(appSpecPath), "e2e/app.spec.ts must exist");
const appSpec = fs.readFileSync(appSpecPath, "utf8");

assert(
  !appSpec.includes('page.locator("details").filter({ hasText: "Languages" })'),
  "e2e/app.spec.ts must not use ambiguous locator('details').filter({ hasText: 'Languages' })",
);
assert(
  appSpec.includes('has: page.locator("summary", { hasText: "Languages" })'),
  "e2e/app.spec.ts must disambiguate Languages panel via summary header",
);
console.log("✅ PASS: e2e/app.spec.ts uses disambiguated Languages panel locators");

// 3. Verify src/routes/index.tsx provides data-panel attributes on details elements
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf8");
assert(
  indexContent.includes('data-panel={title.toLowerCase()'),
  "src/routes/index.tsx must emit data-panel attribute on collapsible details",
);
console.log("✅ PASS: src/routes/index.tsx tags details with data-panel attribute");

console.log("====================================================");
console.log("🎉 Playwright Panel Locators Verification PASSED!");
console.log("====================================================");
