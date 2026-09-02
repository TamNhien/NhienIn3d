import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.14.0 Ops maintenance dark action va key lifecycle quorum alert UI", () => {
  const page = read("../app/quan-tri/ops/page.tsx");
  const css = read("../app/quan-tri/ops/page.module.css");
  const lib = read("../lib/quan-tri.ts");
  assert.match(page, /maintenanceAddButton/);
  assert.match(page, /Ed25519 lifecycle: active/);
  assert.match(page, /runtime\?\.quorum_alerting\?\.enabled/);
  assert.match(css, /\.maintenanceAddButton\{/);
  assert.match(css, /background:#172137!important/);
  assert.match(lib, /asymmetric_key_lifecycle/);
  assert.match(lib, /quorum_alerting/);
});
