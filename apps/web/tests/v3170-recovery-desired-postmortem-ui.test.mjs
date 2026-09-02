import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.17.0 Ops UI hien desired-state recovery va postmortem", () => {
  const page = read("../app/quan-tri/ops/page.tsx");
  const lib = read("../lib/quan-tri.ts");
  assert.match(page, /Probe desired-state · canary rollout/);
  assert.match(page, /Recovery readiness · RPO\/RTO/);
  assert.match(page, /Incident postmortem · runbook/);
  assert.match(page, /remote code execution: OFF/);
  assert.match(page, /SIGNING REQUIRED/);
  assert.match(lib, /ProbeDesiredStateAdmin/);
  assert.match(lib, /DatabaseRecoveryAdmin/);
  assert.match(lib, /IncidentPostmortemAdmin/);
  assert.match(lib, /rollbackProbeDesiredStateAdmin/);
  assert.match(lib, /luuIncidentPostmortemAdmin/);
});
