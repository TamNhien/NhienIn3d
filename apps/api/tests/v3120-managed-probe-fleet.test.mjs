import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.12.0 API co managed probe fleet coverage an toan", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const controller = read("../src/quan-tri/quan-tri.controller.ts");
  assert.match(service, /registration_coverage_percent/);
  assert.match(service, /online_coverage_percent/);
  assert.match(service, /key_coverage_percent/);
  assert.match(service, /UNMANAGED_AGENT/);
  assert.match(service, /REGION_MISMATCH/);
  assert.match(service, /NODE_MISMATCH/);
  assert.match(service, /secret_values_exposed: false/);
  assert.match(controller, /ops_runtime\(\) \{ return this\.service\.trang_thai_ops_v3150\(\); \}/);
});

test("v3.12.0 API health va OpenAPI dong bo version", () => {
  const health = read("../src/suc-khoe/suc-khoe.controller.ts");
  const main = read("../src/main.ts");
  assert.match(health, /phien_ban: "v3\.15\.0"/);
  assert.match(main, /setVersion\("3\.15\.0"\)/);
});
