import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.16.0 API archive portability on-call continuity va runtime version", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const controller = read("../src/quan-tri/quan-tri.controller.ts");
  const health = read("../src/suc-khoe/suc-khoe.controller.ts");
  const main = read("../src/main.ts");
  assert.match(service, /trang_thai_ops_v3160/);
  assert.match(service, /xuat_archive_bundle_v3160/);
  assert.match(service, /restore_archive_partition_v3160/);
  assert.match(service, /xuat_on_call_calendar_v3160/);
  assert.match(service, /handoff_on_call_v3160/);
  assert.match(controller, /trang_thai_ops_v3180/);
  assert.match(health, /phien_ban: "v3\.18\.0"/);
  assert.match(main, /setVersion\("3\.18\.0"\)/);
});

test("v3.16.0 API device-bound enrollment chi luu hash va co rotation metadata", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const publicController = read("../src/quan-tri/probe-agent.controller.ts");
  assert.match(service, /device_id_hash/);
  assert.match(service, /rotation_due_at/);
  assert.match(service, /rotation_due/);
  assert.match(service, /ED25519-ENROLLED-DEVICE-v3160/);
  assert.match(publicController, /x-nhienin3d-device-id/);
  assert.doesNotMatch(service, /raw_device_id:\s*/);
});
