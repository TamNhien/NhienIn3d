import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.17.0 contract recovery desired-state postmortem duoc giu khi current v3.19.0", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const controller = read("../src/quan-tri/quan-tri.controller.ts");
  const health = read("../src/suc-khoe/suc-khoe.controller.ts");
  assert.match(service, /trang_thai_ops_v3170/);
  assert.match(service, /probe_desired_state/);
  assert.match(service, /database_recovery/);
  assert.match(service, /incident_postmortem/);
  assert.match(controller, /trang_thai_ops_v3190/);
  assert.match(controller, /probe-desired-state/);
  assert.match(controller, /postmortem/);
  assert.match(health, /v3\.19\.0/);
});

test("v3.17.0 API desired-state khong co remote code execution", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  assert.match(service, /remote_code_execution: false/);
  assert.match(service, /signed_delivery: signing\.configured/);
  assert.match(service, /private_key_exposed: false/);
  assert.match(service, /SIGNING_REQUIRED/);
  assert.match(service, /signPayload\(null/);
  assert.match(service, /rollout_percent/);
  assert.match(service, /rollback_of/);
});

test("v3.17.0 Admin health contract duoc dong bo current v3.19.0", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const start = service.indexOf("async suc_khoe_he_thong");
  const end = service.indexOf("async ", start + 10);
  const healthMethod = service.slice(start, end > start ? end : undefined);
  assert.match(healthMethod, /phien_ban:\s*"3\.19\.0"/);
});
