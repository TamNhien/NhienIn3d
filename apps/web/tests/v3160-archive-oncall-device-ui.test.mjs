import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.16.0 Ops UI co archive bundle on-call handoff va device rotation state", () => {
  const page = read("../app/quan-tri/ops/page.tsx");
  const lib = read("../lib/quan-tri.ts");
  assert.match(page, /OPS v3\.17\.0/);
  assert.match(page, /Tải bundle/);
  assert.match(page, /Xuất ICS/);
  assert.match(page, />Handoff</);
  assert.match(page, /device-bound/);
  assert.match(page, /rotation due/);
  assert.match(lib, /archive_portability\?/);
  assert.match(lib, /on_call_v3160\?/);
  assert.match(lib, /xuatOpsArchiveBundleAdmin/);
  assert.match(lib, /xuatOpsOnCallCalendarAdmin/);
});
