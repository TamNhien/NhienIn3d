import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.10.0 Ops Dashboard hien persistent endpoint Apdex va probe agent", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  const lib = read("lib/quan-tri.ts");
  assert.match(page, /(?:Persistent endpoint SLI \+ Apdex|Distributed probe agents)/);
  assert.match(page, />Apdex</);
  assert.match(page, /persistent samples/);
  assert.match(page, /probe_agents/);
  assert.match(lib, /persistent_samples/);
  assert.match(lib, /probe_agents/);
  assert.match(lib, /apdex\?/);
});

test("v3.10.0 Ops Dashboard co encrypted DLQ scheduled retry va RBAC on-call", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  const lib = read("lib/quan-tri.ts");
  assert.match(page, /Webhook encrypted DLQ \+ (?:scheduled retry|retry budget)/);
  assert.match(page, /AES-256-GCM/);
  assert.match(page, /RBAC Ops \/ on-call theo dịch vụ/);
  assert.match(page, /OPS_VIEWER/);
  assert.match(page, /ON_CALL/);
  assert.match(page, /SERVICE_OWNER/);
  assert.match(lib, /layOpsRuntimeAdmin/);
  assert.match(lib, /layOpsPhanCongAdmin/);
  assert.match(lib, /taoOpsPhanCongAdmin/);
});

test("v3.10.0 non-admin Ops co read-only dashboard va timeline route", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  const lib = read("lib/quan-tri.ts");
  assert.match(page, /layOpsDashboardReadonly/);
  assert.match(page, /layOpsTimelineReadonly/);
  assert.match(page, /Chế độ read-only theo RBAC Ops\/on-call/);
  assert.match(lib, /\/ops\/dashboard/);
  assert.match(lib, /\/ops\/su-co\/\$\{encodeURIComponent\(chu_ky\)\}\/timeline/);
});
