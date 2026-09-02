import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.15.0 Ops hien enrollment va service dependency blast radius compact", () => {
  const page = read("../app/quan-tri/ops/page.tsx");
  const lib = read("../lib/quan-tri.ts");
  assert.match(page, /Service dependency · blast radius/);
  assert.match(page, /Blast radius/);
  assert.match(page, /Enrollment/);
  assert.match(page, /probe_enrollment/);
  assert.match(lib, /OpsServiceDependency/);
  assert.match(lib, /probe_enrollment\?/);
});
