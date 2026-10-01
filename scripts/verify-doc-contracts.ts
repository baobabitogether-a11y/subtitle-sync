import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

const rootDir = process.cwd();

console.log('====================================================');
console.log('🧪 Starting Architectural Documentation Contracts Test');
console.log('====================================================');

const requiredDocFiles = [
  'docs/operations/ACTIONS.md',
  'docs/specifications/LIBRARY.md',
  'docs/designs/DESIGN_SUBTITLE_VIEWS.md',
  'docs/designs/DESIGN_VIEW_LANGS.md',
  'docs/designs/DESIGN_CONTROLS_VIEW.md',
  'docs/designs/DESIGN_PLAYER_PROVIDER.md',
  'docs/designs/DESIGN_STATE_COORDINATOR.md',
  'docs/specifications/SCHEMA_TIMEDTEXT.md',
  'docs/operations/DEBUG.md',
];

for (const relPath of requiredDocFiles) {
  const fullPath = path.resolve(rootDir, relPath);
  assert(fs.existsSync(fullPath), `Required documentation contract must exist: ${relPath}`);
  const stat = fs.statSync(fullPath);
  assert(stat.size > 500, `Documentation file ${relPath} must be non-trivial (>500 bytes), got ${stat.size} bytes`);
  console.log(`✅ PASS: ${relPath} exists (${stat.size} bytes)`);
}

// Verify that README.md references all 9 contracts
const readmePath = path.resolve(rootDir, 'README.md');
assert(fs.existsSync(readmePath), 'README.md must exist');
const readmeContent = fs.readFileSync(readmePath, 'utf8');

for (const relPath of requiredDocFiles) {
  const linkRef = `./${relPath}`;
  assert(
    readmeContent.includes(linkRef) || readmeContent.includes(relPath),
    `README.md must link to ${relPath}`,
  );
  console.log(`✅ PASS: README.md links to ${relPath}`);
}

// Verify docs/files.md registers all 9 contracts
const filesMdPath = path.resolve(rootDir, 'docs/files.md');
const filesMdContent = fs.readFileSync(filesMdPath, 'utf8');
for (const relPath of requiredDocFiles) {
  assert(filesMdContent.includes(relPath), `docs/files.md must register ${relPath}`);
  console.log(`✅ PASS: docs/files.md registers ${relPath}`);
}

console.log('====================================================');
console.log('📊 ARCHITECTURAL CONTRACTS TEST: All tests passed!');
console.log('====================================================');
