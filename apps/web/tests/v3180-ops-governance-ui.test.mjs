import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.18.0 Ops UI co health gate PITR approval va badge compact", () => {
  const page = read("../app/quan-tri/ops/page.tsx");
  const css = read("../app/quan-tri/ops/page.module.css");
  const lib = read("../lib/quan-tri.ts");
  assert.match(page, /health gate/);
  assert.match(page, /target-time PITR/);
  assert.match(page, /Duyệt/);
  assert.match(page, /Yêu cầu sửa/);
  assert.match(page, /postmortemStatusBadge/);
  assert.match(css, /height:20px/);
  assert.match(css, /text-align:center/);
  assert.match(lib, /duyetIncidentPostmortemAdmin/);
  assert.match(lib, /probe_health_gate/);
});
