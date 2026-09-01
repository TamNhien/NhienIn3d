import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.8.0 Web hien endpoint SLO time-weighted va comparison 7 30 90", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  assert.match(page, /So sánh SLO 7 \/ 30 \/ 90 ngày/);
  assert.match(page, /Endpoint SLO · time-weighted/);
  assert.match(page, /Burn-rate theo thời gian/);
  assert.match(page, /Endpoint probes/);
});

test("v3.8.0 Web incident timeline co search cursor load more", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  const lib = read("lib/quan-tri.ts");
  assert.match(page, /Tìm full-text trong mô tả \/ JSON timeline/);
  assert.match(page, /Tải thêm timeline/);
  assert.match(lib, /layTimelineSuCoVanHanhAdmin/);
});

test("v3.8.0 Web webhook dead-letter co replay", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  const lib = read("lib/quan-tri.ts");
  assert.match(page, /Dead-letter queue/);
  assert.match(page, /Replay/);
  assert.match(lib, /layWebhookDeadLetterAdmin/);
  assert.match(lib, /replayWebhookDeadLetterAdmin/);
});
