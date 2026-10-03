import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  isSuccessfulFetch,
  trackNetworkRequest,
  clearNetworkRequests,
  getNetworkRequests,
  type NetworkRequestRecord,
} from "../src/utils/networkTracker";

console.log("====================================================");
console.log("🧪 Starting Clean Network Records & Good Fetch Indicator Test");
console.log("====================================================");

// 1. Verify isSuccessfulFetch logic
clearNetworkRequests();

const mockPending: NetworkRequestRecord = {
  id: "req-1",
  url: "https://www.youtube.com/api/timedtext?v=test&lang=en",
  method: "GET",
  type: "fetch",
  startTime: Date.now(),
  status: 0,
  isPending: true,
};
assert.strictEqual(isSuccessfulFetch(mockPending), false, "Pending request must not be marked successful");

const mockError: NetworkRequestRecord = {
  id: "req-2",
  url: "https://www.youtube.com/api/timedtext?v=test&lang=en",
  method: "GET",
  type: "fetch",
  startTime: Date.now(),
  status: 500,
  error: "Internal Server Error",
  isPending: false,
};
assert.strictEqual(isSuccessfulFetch(mockError), false, "Error request must not be marked successful");

const mockEmpty200: NetworkRequestRecord = {
  id: "req-3",
  url: "https://www.youtube.com/api/timedtext?v=test&lang=en&tlang=es",
  method: "GET",
  type: "native_bridge",
  startTime: Date.now(),
  status: 200,
  fullResponseBody: "",
  responseBodyPreview: "",
  isPending: false,
};
assert.strictEqual(
  isSuccessfulFetch(mockEmpty200),
  false,
  "200 OK request with empty response body must NOT be marked successful",
);

const mockWhitespace200: NetworkRequestRecord = {
  id: "req-4",
  url: "https://www.youtube.com/api/timedtext?v=test&lang=en&tlang=fr",
  method: "GET",
  type: "native_bridge",
  startTime: Date.now(),
  status: 200,
  fullResponseBody: "   \n  \t  ",
  responseBodyPreview: "",
  isPending: false,
};
assert.strictEqual(
  isSuccessfulFetch(mockWhitespace200),
  false,
  "200 OK request with whitespace-only body must NOT be marked successful",
);

const mockGood200: NetworkRequestRecord = {
  id: "req-5",
  url: "https://www.youtube.com/api/timedtext?v=test&lang=en&tlang=he",
  method: "GET",
  type: "native_bridge",
  startTime: Date.now(),
  status: 200,
  fullResponseBody: '{"events":[{"tStartMs":0,"dDurationMs":1000,"segs":[{"utf8":"שלום"}]}]}',
  responseBodyPreview: '{"events":[{"tStartMs":0,"dDurationMs":1000,"segs":[{"utf8":"שלום"}]}]}',
  isPending: false,
};
assert.strictEqual(
  isSuccessfulFetch(mockGood200),
  true,
  "200 OK request with non-empty payload must be marked successful",
);
console.log("✅ PASS: isSuccessfulFetch correctly evaluates success and excludes empty bodies");

// 2. Verify tracking pipeline preserves authentic HTTP status
const tracker = trackNetworkRequest("https://www.youtube.com/api/timedtext?v=test&lang=en&tlang=de");
tracker.complete(200, "");
const recorded = getNetworkRequests()[0];
assert.strictEqual(recorded.status, 200, "HTTP status must accurately reflect 200 response");
assert.strictEqual(recorded.fullResponseBody, "", "Response body must be empty string");
assert.strictEqual(isSuccessfulFetch(recorded), false, "Recorded empty response must not be successful");
console.log("✅ PASS: Authentic HTTP status preserved while excluding empty body from successful");

// 3. Verify NetworkRequestsInspector UI code contracts
const inspectorPath = path.join(
  process.cwd(),
  "src/components/NetworkRequestsInspector.tsx",
);
assert(fs.existsSync(inspectorPath), "NetworkRequestsInspector.tsx must exist");
const inspectorContent = fs.readFileSync(inspectorPath, "utf8");

assert(
  inspectorContent.includes("isSuccessfulFetch") &&
    inspectorContent.includes("!isSuccessfulFetch(req)"),
  "NetworkRequestsInspector must use isSuccessfulFetch to treat empty response bodies as failed/unsuccessful",
);
console.log("✅ PASS: Inspector treats empty response bodies as unsuccessful/failed");

assert(
  inspectorContent.includes("good-fetch-badge-"),
  "NetworkRequestsInspector must render green good-fetch-badge for successfully fetched languages",
);
assert(
  inspectorContent.includes("detail-good-fetch-badge"),
  "NetworkRequestsInspector must render detail-good-fetch-badge in detail header",
);
console.log("✅ PASS: Green badge indicators for successfully fetched languages verified");

console.log("====================================================");
console.log("🎉 Clean Network Records & Good Fetch Indicator tests PASSED successfully!");
console.log("====================================================");
