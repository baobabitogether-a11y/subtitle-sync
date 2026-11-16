import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting AGENTS.md Git Commit & docs/git.md Log Rule Verification");
console.log("====================================================");

const rootDir = process.cwd();
const agentsPath = path.join(rootDir, "AGENTS.md");
const gitLogPath = path.join(rootDir, "docs/git.md");
const filesDocPath = path.join(rootDir, "docs/files.md");

assert(fs.existsSync(agentsPath), "AGENTS.md must exist at repo root");
const agentsContent = fs.readFileSync(agentsPath, "utf8");

assert(
  agentsContent.includes("docs/git.md") && agentsContent.includes("git commit"),
  "AGENTS.md must instruct attempting git commit and logging to docs/git.md after every sub-task",
);
console.log("✅ PASS: AGENTS.md requires git commit and docs/git.md logging per sub-task.");

assert(fs.existsSync(gitLogPath), "docs/git.md must exist");
const gitLogContent = fs.readFileSync(gitLogPath, "utf8");
assert(
  gitLogContent.includes("## Checkpoints") && gitLogContent.includes("Task 426"),
  "docs/git.md must maintain a Checkpoints table with sub-task commit/push records",
);
console.log("✅ PASS: docs/git.md exists and contains checkpoint records.");

const filesDoc = fs.readFileSync(filesDocPath, "utf8");
assert(filesDoc.includes("docs/git.md"), "docs/files.md must catalog docs/git.md");
console.log("✅ PASS: docs/files.md catalogs docs/git.md.");

console.log("====================================================");
console.log("🎉 AGENTS.md Git Log Rule Verification PASSED!");
console.log("====================================================");
