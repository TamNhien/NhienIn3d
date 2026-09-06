import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(p, "utf8");

test("v3.20.0 Ops UI co rollout approval recovery audit bundle va remediation controls", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  const lib = read("lib/quan-tri.ts");
  assert.match(page, /NHIENIN3D · OPS v3\.25\.0/);
  assert.match(page, /two-person rule/);
  assert.match(page, /Duyệt production rollout/);
  assert.match(page, /SHA-256/);
  assert.match(page, /Tải recovery audit bundle/);
  assert.match(page, /SLA theo P1-P4/);
  assert.match(page, /Xuất remediation Excel/);
  assert.match(page, /Escalate SLA breach/);
  assert.match(page, /Postmortem action severity/);
  assert.match(page, /Postmortem action service/);
  assert.match(lib, /approveProbeRolloutAdmin/);
  assert.match(lib, /xuatRecoveryEvidenceBundleAdmin/);
  assert.match(lib, /xuatRemediationBacklogExcelAdmin/);
  assert.match(lib, /escalateRemediationBacklogAdmin/);
});

test("v3.20.0 Browser E2E khoa cac control governance moi", () => {
  const e2e = read("../../scripts/e2e-browser-v3200.mjs");
  assert.match(e2e, /Tải recovery audit bundle/);
  assert.match(e2e, /Xuất remediation Excel/);
  assert.match(e2e, /Escalate SLA breach/);
  assert.match(e2e, /Browser E2E v3\.20\.0 PASS/);
});
