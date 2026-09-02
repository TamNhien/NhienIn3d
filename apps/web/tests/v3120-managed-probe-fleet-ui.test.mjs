import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.12.0 Ops Dashboard hien managed probe fleet compact", () => {
  const page = read("../app/quan-tri/ops/page.tsx");
  const css = read("../app/quan-tri/ops/page.module.css");
  const lib = read("../lib/quan-tri.ts");
  assert.match(page, />Managed probe fleet</);
  assert.match(page, /runtime\?\.probe_fleet\?\.key_coverage_percent/);
  assert.match(page, /per-agent key/);
  assert.match(css, /\.compactPanel\{/);
  assert.match(css, /\.fleetStats\{/);
  assert.match(css, /\.fleetList\{/);
  assert.match(lib, /export type OpsProbeFleet/);
  assert.match(lib, /secret_values_exposed: false/);
});
