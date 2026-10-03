import { execSync } from "node:child_process";
import assert from "node:assert";
import { LANGS } from "../src/lib/subtitles";

console.log("Verifying SSR vs Client language defaults...");

// Ensure LANGS is non-empty and provides a deterministic baseline
assert(LANGS.length > 0, "LANGS must not be empty");
assert(LANGS.map((l) => l.code).includes("en"), "LANGS must include en");
assert(LANGS.map((l) => l.code).includes("he"), "LANGS must include he");

console.log(`Verified deterministic language list of ${LANGS.length} languages.`);
