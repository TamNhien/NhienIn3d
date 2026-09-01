import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.5.0 source co migration incident aggregate va SLO", () => {
  assert.equal(existsSync("apps/api/prisma/migrations/202609010001_v350_incident_slo_rollup/migration.sql"), true);
  const schema = doc("apps/api/prisma/schema.prisma");
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  assert.match(schema, /model SuCoVanHanh/);
  assert.match(svc, /dong_bo_tong_hop_su_co/);
  assert.match(svc, /SLO_VAN_HANH_CAU_HINH/);
});

test("v3.5.0 source co runtime va browser E2E", () => {
  assert.equal(existsSync("scripts/e2e-runtime-v350.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v350.mjs"), true);
});
