import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  trackNetworkRequest,
  clearNetworkRequests,
  getNetworkRequests,
  truncateResponseBody,
  extractTlang,
  formatRequestForClipboard,
  MAX_RESPONSE_BODY_PREVIEW_CHARS,
} from "../src/utils/networkTracker";

console.log("====================================================");
console.log("🧪 Starting Network Requests Inspector & 250-char Accordion Test");
console.log("====================================================");

// 1. Verify MAX_RESPONSE_BODY_PREVIEW_CHARS is 250
assert.strictEqual(
  MAX_RESPONSE_BODY_PREVIEW_CHARS,
  250,
  "Preview character limit must strictly be 250",
);
console.log("✅ PASS: MAX_RESPONSE_BODY_PREVIEW_CHARS is 250");

// 2. Verify truncation utility
const longBody =
  '{"events":[{"tStartMs":0,"dDurationMs":4000,"segs":[{"utf8":"Hello world this is an extended subtitle string designed to thoroughly test that response previews now capture up to two hundred and fifty complete characters smoothly without overflow across all platforms!"}]}]}';
const truncated = truncateResponseBody(longBody);
assert.strictEqual(truncated.length, 250, "Truncated length must be exactly 250 characters");
assert.strictEqual(
  truncated,
  longBody.slice(0, 250),
  "Truncated string must match first 250 characters of original body",
);
console.log(`✅ PASS: Truncated sample payload to first 250 chars: "${truncated}"`);

// Test with object payload
const objectBody = {
  test: "data",
  value: 123456789,
  extendedKey: "abcdefghijklmnopqrstuvwxyz".repeat(15),
};
const objTruncated = truncateResponseBody(objectBody);
assert.strictEqual(
  objTruncated.length,
  250,
  "Object body must be serialized and truncated to 250 chars",
);
assert.strictEqual(objTruncated, JSON.stringify(objectBody).slice(0, 250));
console.log(`✅ PASS: Truncated object payload to first 250 chars: "${objTruncated}"`);

// Test edge cases: empty, undefined, null
assert.strictEqual(truncateResponseBody(""), "");
assert.strictEqual(truncateResponseBody(null), "");
assert.strictEqual(truncateResponseBody(undefined), "");
console.log("✅ PASS: Edge cases handled safely");

// 3. Verify request recording pipeline and full response body storage
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
assert.strictEqual(recorded1.responseBodyPreview, longBody.slice(0, 250));
assert.strictEqual(recorded1.responseBodyPreview?.length, 250);
assert.strictEqual(
  recorded1.fullResponseBody,
  longBody,
  "Full response body must be retained intact",
);
console.log(
  "✅ PASS: Timedtext request recorded with status 200, first 250 chars preview, and full response body",
);

// Simulate native bridge translated caption request for Hebrew
const hebrewUrl = "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3&tlang=he";
const tracker2 = trackNetworkRequest(hebrewUrl, "GET", "native_bridge");
const hebrewPayload =
  '{"events":[{"tStartMs":0,"dDurationMs":2000,"segs":[{"utf8":"שלום עולם יקר - בדיקה מורחבת של תצוגה מקדימה עד למאתיים וחמישים תווים מלאים של תוכן התשובה ברשת המנוטרת בצורה מהימנה ותקינה לחלוטין וללא שום שגיאה כלשהי בכלל, המאפשרת פריסה מלאה של כל התוכן באקורדיון מותאם"}]}]}';
tracker2.complete(200, hebrewPayload);

const allRequests = getNetworkRequests();
assert.strictEqual(allRequests.length, 2, "Expected 2 recorded requests");
const recorded2 = allRequests.find((r) => r.url === hebrewUrl);
assert(recorded2 !== undefined, "Hebrew request must be tracked");
assert.strictEqual(recorded2?.responseBodyPreview, hebrewPayload.slice(0, 250));
assert.strictEqual(recorded2?.responseBodyPreview?.length, 250);
assert.strictEqual(recorded2?.fullResponseBody, hebrewPayload);
console.log(
  `✅ PASS: Native bridge translated request recorded with 250-char preview and full body`,
);

// 4. Verify extractTlang and formatRequestForClipboard utilities
assert.strictEqual(
  extractTlang("https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&tlang=es&fmt=json3"),
  "es",
  "extractTlang must correctly parse 'es'",
);
assert.strictEqual(
  extractTlang("https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&tlang=de"),
  "de",
  "extractTlang must correctly parse 'de'",
);
assert.strictEqual(
  extractTlang("https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en"),
  null,
  "extractTlang must return null when tlang is absent",
);
console.log("✅ PASS: extractTlang utility verified");

const sampleFormatted = formatRequestForClipboard(recorded2!);
assert.ok(sampleFormatted.includes("URL: " + hebrewUrl), "Formatted request must include URL");
assert.ok(
  sampleFormatted.includes("Target Language (tlang): he"),
  "Formatted request must include tlang",
);
assert.ok(sampleFormatted.includes("Method: GET"), "Formatted request must include Method");
console.log("✅ PASS: formatRequestForClipboard utility verified");

// Test empty body recording for 200 OK request
const emptyUrl = "https://www.youtube.com/api/timedtext?v=test&lang=fr&tlang=fr";
const trackerEmpty = trackNetworkRequest(emptyUrl, "GET", "fetch");
trackerEmpty.complete(200, "");
const emptyRecorded = getNetworkRequests().find((r) => r.url === emptyUrl);
assert.strictEqual(emptyRecorded?.status, 200);
assert.strictEqual(emptyRecorded?.fullResponseBody, "");
assert.strictEqual(emptyRecorded?.responseBodyPreview, "");
console.log("✅ PASS: 200 OK empty response recorded with 0 characters");

// 5. Verify Inspector UI component accordion and index.tsx wiring
const inspectorComponentPath = path.join(
  process.cwd(),
  "src/components/NetworkRequestsInspector.tsx",
);
assert(fs.existsSync(inspectorComponentPath), "NetworkRequestsInspector.tsx component must exist");
const inspectorContent = fs.readFileSync(inspectorComponentPath, "utf8");
assert(
  inspectorContent.includes("First 250 chars:"),
  "Network inspector must display 'First 250 chars:' preview label",
);
assert(
  inspectorContent.includes("First 250 Chars Accordion"),
  "Network inspector must display accordion header for 250 chars",
);
assert(
  inspectorContent.includes("Expose Whole Response Body"),
  "Network inspector must provide button to expose whole response body",
);
assert(
  inspectorContent.includes('data-testid="network-inspector-modal"'),
  "Network inspector must render modal with test id",
);
assert(
  inspectorContent.includes('data-testid="toggle-hide-failed-requests"'),
  "Network inspector must provide toggle to filter out failed requests",
);
assert(
  inspectorContent.includes("copy-request-button-"),
  "Network inspector must provide quick copy request button on items",
);
assert(
  inspectorContent.includes("copy-full-request-button"),
  "Network inspector must provide copy full request button in detail view",
);
assert(
  inspectorContent.includes("break-words") && inspectorContent.includes("whitespace-pre-wrap"),
  "Network inspector must word wrap request text with break-words and whitespace-pre-wrap",
);
assert(
  inspectorContent.includes("tlang-tag-"),
  "Network inspector must render language tag based on tlang parameter",
);
assert(
  inspectorContent.includes("empty body — 0 chars") ||
    inspectorContent.includes("0 chars (empty body)"),
  "Network inspector must explicitly clarify 200 OK empty response body with 0 chars",
);
console.log(
  "✅ PASS: Network inspector failed filtering, quick copy, word-wrap, tlang tags, and empty body clarity verified",
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
console.log("✅ PASS: Network inspector accordion UI and modal trigger integrated in app");

console.log("====================================================");
console.log("📊 NETWORK INSPECTOR ENHANCEMENTS TEST: All tests passed!");
console.log("====================================================");
