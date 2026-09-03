import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.18.0 API runtime co health gate PITR governance va version", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const controller = read("../src/quan-tri/quan-tri.controller.ts");
  const health = read("../src/suc-khoe/suc-khoe.controller.ts");
  assert.match(service, /trang_thai_ops_v3180/);
  assert.match(service, /probe_health_gate/);
  assert.match(service, /pitr_target_time_supported/);
  assert.match(service, /service_runbooks/);
  assert.match(controller, /trang_thai_ops_v3180/);
  assert.match(controller, /postmortem\/approval/);
  assert.match(health, /v3\.18\.0/);
});

test("v3.18.0 API health gate khong co remote code execution", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const start = service.indexOf("private async auto_rollback_probe_desired_state_v3180");
  const end = service.indexOf("private ", start + 20);
  const healthGateBlock = service.slice(start, end > start ? end : undefined);
  assert.ok(start >= 0);
  assert.match(healthGateBlock, /remote_code_execution: false/);
  assert.doesNotMatch(healthGateBlock, /child_process|exec\(|spawn\(/);
});
