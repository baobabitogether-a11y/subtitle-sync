import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  trackNetworkRequest,
  clearNetworkRequests,
  getNetworkRequests,
  truncateResponseBody,
  MAX_RESPONSE_BODY_PREVIEW_CHARS,
} from "../src/utils/networkTracker";

console.log("====================================================");
console.log("🧪 Starting Network Requests Inspector & 50-char Body Test");
console.log("====================================================");

// 1. Verify MAX_RESPONSE_BODY_PREVIEW_CHARS is 50
assert.strictEqual(
  MAX_RESPONSE_BODY_PREVIEW_CHARS,
  50,
  "Preview character limit must strictly be 50",
);
console.log("✅ PASS: MAX_RESPONSE_BODY_PREVIEW_CHARS is 50");

// 2. Verify truncation utility
const longBody = "{\"events\":[{\"tStartMs\":0,\"dDurationMs\":4000,\"segs\":[{\"utf8\":\"Hello world\"}]}]}";
const truncated = truncateResponseBody(longBody);
assert.strictEqual(truncated.length, 50, "Truncated length must be exactly 50 characters");
assert.strictEqual(
  truncated,
  longBody.slice(0, 50),
  "Truncated string must match first 50 characters of original body",
);
console.log(`✅ PASS: Truncated sample payload to first 50 chars: "${truncated}"`);

// Test with object payload
const objectBody = { test: "data", value: 123456789, extendedKey: "abcdefghijklmnopqrstuvwxyz" };
const objTruncated = truncateResponseBody(objectBody);
assert.strictEqual(objTruncated.length, 50, "Object body must be serialized and truncated to 50 chars");
assert.strictEqual(objTruncated, JSON.stringify(objectBody).slice(0, 50));
console.log(`✅ PASS: Truncated object payload to first 50 chars: "${objTruncated}"`);

// Test edge cases: empty, undefined, null
assert.strictEqual(truncateResponseBody(""), "");
assert.strictEqual(truncateResponseBody(null), "");
assert.strictEqual(truncateResponseBody(undefined), "");
console.log("✅ PASS: Edge cases handled safely");

// 3. Verify request recording pipeline
clearNetworkRequests();
assert.strictEqual(getNetworkRequests().length, 0, "Requests must be empty initially");

// Simulate timedtext request
const timedTextUrl = "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3";
const tracker1 = trackNetworkRequest(timedTextUrl, "GET", "timedtext_interception");
assert.strictEqual(getNetworkRequests().length, 1);
assert.strictEqual(getNetworkRequests()[0].isPending, true);

tracker1.complete(200, longBody);
const recorded1 = getNetworkRequests()[0];
assert.strictEqual(recorded1.status, 200);
assert.strictEqual(recorded1.isPending, false);
assert.strictEqual(recorded1.responseBodyPreview, longBody.slice(0, 50));
assert.strictEqual(recorded1.responseBodyPreview?.length, 50);
console.log("✅ PASS: Timedtext request recorded with status 200 and first 50 chars of response");

// Simulate native bridge translated caption request for Hebrew
const hebrewUrl = "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3&tlang=he";
const tracker2 = trackNetworkRequest(hebrewUrl, "GET", "native_bridge");
const hebrewPayload = "{\"events\":[{\"tStartMs\":0,\"dDurationMs\":2000,\"segs\":[{\"utf8\":\"שלום עולם יקר\"}]}]}";
tracker2.complete(200, hebrewPayload);

const allRequests = getNetworkRequests();
assert.strictEqual(allRequests.length, 2, "Expected 2 recorded requests");
const recorded2 = allRequests.find((r) => r.url === hebrewUrl);
assert(recorded2 !== undefined, "Hebrew request must be tracked");
assert.strictEqual(recorded2?.responseBodyPreview, hebrewPayload.slice(0, 50));
assert.strictEqual(recorded2?.responseBodyPreview?.length, 50);
console.log(`✅ PASS: Native bridge translated request recorded with 50-char preview: "${recorded2?.responseBodyPreview}"`);

// 4. Verify Inspector UI component and index.tsx wiring
const inspectorComponentPath = path.join(
  process.cwd(),
  "src/components/NetworkRequestsInspector.tsx",
);
assert(fs.existsSync(inspectorComponentPath), "NetworkRequestsInspector.tsx component must exist");
const inspectorContent = fs.readFileSync(inspectorComponentPath, "utf8");
assert(
  inspectorContent.includes("First 50 chars:"),
  "Network inspector must display 'First 50 chars:' preview label",
);
assert(
  inspectorContent.includes("First X=50 Characters"),
  "Network inspector must display 'First X=50 Characters' section title",
);
assert(
  inspectorContent.includes("data-testid=\"network-inspector-modal\""),
  "Network inspector must render modal with test id",
);

const indexRoutePath = path.join(process.cwd(), "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexRoutePath, "utf8");
assert(
  indexContent.includes("open-network-inspector-button"),
  "index.tsx must contain open-network-inspector-button",
);
assert(
  indexContent.includes("<NetworkRequestsInspector"),
  "index.tsx must render NetworkRequestsInspector component",
);
console.log("✅ PASS: Network inspector UI and modal trigger integrated in app");

console.log("====================================================");
console.log("📊 NETWORK INSPECTOR 50-CHAR TEST: All tests passed!");
console.log("====================================================");
