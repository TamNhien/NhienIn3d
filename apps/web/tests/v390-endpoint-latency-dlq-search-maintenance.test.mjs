import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.9.0 Ops hien endpoint latency va maintenance-aware SLO", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  assert.match(page, /Endpoint SLO · (?:time-weighted \+ latency|distributed region\/node)/);
  assert.match(page, /Latency SLI/);
  assert.match(page, /P95 \/ Target/);
  assert.match(page, /Maintenance-aware SLO/);
  assert.match(page, /Loại maintenance khỏi availability/);
  assert.match(page, /Endpoint method/);
  assert.match(page, /Endpoint auth/);
});

test("v3.9.0 Ops webhook DLQ co acknowledge bulk replay va retention status", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  const lib = read("lib/quan-tri.ts");
  assert.match(page, /Webhook (?:delivery \+ DLQ lifecycle|encrypted DLQ \+ (?:scheduled retry|retry budget))/);
  assert.match(page, /(?:Replay bulk chờ|Tạo bulk replay job)/);
  assert.match(page, /Acknowledge/);
  assert.match(page, /trang_thai_dlq/);
  assert.match(lib, /acknowledgeWebhookDeadLetterAdmin/);
  assert.match(lib, /replayBulkWebhookDeadLetterAdmin/);
});

test("v3.9.0 Ops incident timeline ghi ro GIN full-text", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  assert.match(page, /Incident \+ timeline GIN full-text/);
  assert.match(page, /Tìm full-text trong mô tả \/ JSON timeline/);
});
