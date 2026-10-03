import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  hasVideoFixtures,
  getVideoFixtureJson3,
  getAllVideoFixtureTracks,
} from "../src/utils/videoFixturesRegistry";

console.log("====================================================");
console.log("🧪 Starting Presented Video Subtitles Verification Test");
console.log("====================================================");

// 1. Verify JustinGuitar demo video (L2Ryrr6txwA)
assert(hasVideoFixtures("L2Ryrr6txwA"), "L2Ryrr6txwA must have registered fixtures");
const l2ryTracks = getAllVideoFixtureTracks("L2Ryrr6txwA");
assert(l2ryTracks && l2ryTracks.en, "L2Ryrr6txwA must have English tracks");
const l2ryText = l2ryTracks.en.events
  .flatMap((e) => e.segs || [])
  .map((s) => s.utf8 || "")
  .join(" ");
assert(
  l2ryText.toLowerCase().includes("justin"),
  "L2Ryrr6txwA must contain authentic JustinGuitar subtitles",
);
console.log("✅ PASS: L2Ryrr6txwA fixtures verified strictly for JustinGuitar");

// 2. Verify Steve Jobs Stanford 2005 video (n9qwEOsqsoo)
assert(hasVideoFixtures("n9qwEOsqsoo"), "n9qwEOsqsoo must have registered fixtures");
const n9qwEn = getVideoFixtureJson3("n9qwEOsqsoo", "en");
assert(n9qwEn, "n9qwEOsqsoo must have English track");
const n9qwText = n9qwEn.events.map((e) => e.segs?.[0]?.utf8 || "").join(" ");
assert(
  n9qwText.includes("commencement") && n9qwText.includes("Stay Hungry"),
  "n9qwEOsqsoo must contain Steve Jobs Stanford commencement speech text",
);
assert(!n9qwText.includes("guitar"), "n9qwEOsqsoo must NOT contain default guitar lesson text");
console.log("✅ PASS: n9qwEOsqsoo fixtures verified strictly for Steve Jobs Stanford speech (no bleeding)");

// 3. Verify Tutorial video (c0pUbsq9FLk)
assert(hasVideoFixtures("c0pUbsq9FLk"), "c0pUbsq9FLk must have registered fixtures");
const c0puEn = getVideoFixtureJson3("c0pUbsq9FLk", "en");
assert(c0puEn, "c0pUbsq9FLk must have English track");
const c0puText = c0puEn.events.map((e) => e.segs?.[0]?.utf8 || "").join(" ");
assert(c0puText.includes("tutorial"), "c0pUbsq9FLk must contain tutorial video speech");
assert(!c0puText.includes("guitar"), "c0pUbsq9FLk must NOT contain default guitar lesson text");
console.log("✅ PASS: c0pUbsq9FLk fixtures verified strictly for Tutorial video (no bleeding)");

// 4. Verify Me at the zoo (jNQXAC9IVRw)
assert(hasVideoFixtures("jNQXAC9IVRw"), "jNQXAC9IVRw must have registered fixtures");
const zooEn = getVideoFixtureJson3("jNQXAC9IVRw", "en");
assert(zooEn, "jNQXAC9IVRw must have English track");
const zooText = zooEn.events.map((e) => e.segs?.[0]?.utf8 || "").join(" ");
assert(zooText.includes("elephants"), "jNQXAC9IVRw must contain elephants speech");
assert(!zooText.includes("guitar"), "jNQXAC9IVRw must NOT contain default guitar lesson text");
console.log("✅ PASS: jNQXAC9IVRw fixtures verified strictly for Me at the zoo (no bleeding)");

// 5. Verify EILFkSGNkdA
assert(hasVideoFixtures("EILFkSGNkdA"), "EILFkSGNkdA must have registered fixtures");
const eilfEn = getVideoFixtureJson3("EILFkSGNkdA", "en");
assert(eilfEn, "EILFkSGNkdA must have English track");
const eilfText = eilfEn.events.map((e) => e.segs?.[0]?.utf8 || "").join(" ");
assert(eilfText.includes("welcome back to the channel"), "EILFkSGNkdA must contain its authentic speech");
assert(!eilfText.includes("guitar"), "EILFkSGNkdA must NOT contain default guitar lesson text");
console.log("✅ PASS: EILFkSGNkdA fixtures verified strictly for EILFkSGNkdA (no bleeding)");

// 6. Verify Arbitrary / Unknown video isolation
const unknownId = "unknown_xyz123";
assert(!hasVideoFixtures(unknownId), "Unknown video must not report having fixtures");
assert(getVideoFixtureJson3(unknownId, "en") === null, "Unknown video must return null for tracks");
assert(getAllVideoFixtureTracks(unknownId) === null, "Unknown video must return null for all tracks");
console.log("✅ PASS: Unknown video returns null and NEVER defaults to another video's subtitles");

// 7. Verify index.tsx does not contain unqualified JSON3_RAW_MAP bleeding
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf8");
assert(
  !indexContent.includes("const bundled = JSON3_RAW_MAP[code]"),
  "index.tsx must not contain unqualified fallback to JSON3_RAW_MAP[code]",
);
assert(
  !indexContent.includes("const bundled = JSON3_RAW_MAP[l.code]"),
  "index.tsx must not contain unqualified fallback to JSON3_RAW_MAP[l.code]",
);
assert(
  indexContent.includes("getVideoFixtureJson3(videoId, code)"),
  "index.tsx must use getVideoFixtureJson3(videoId, code) for scoped video fallback",
);
assert(
  indexContent.includes("getAllVideoFixtureTracks(targetVideo)"),
  "index.tsx must use getAllVideoFixtureTracks(targetVideo) to scope tracks per video",
);
console.log("✅ PASS: src/routes/index.tsx strictly scopes subtitle loading per presented video");

console.log("====================================================");
console.log("🎉 ALL PRESENTED VIDEO SUBTITLES CHECKS PASSED!");
console.log("   ✓ Subtitles strictly correspond to the presented video");
console.log("   ✓ No cross-video subtitle bleeding");
console.log("   ✓ Unknown videos do not show default video's subtitles");
console.log("====================================================");
