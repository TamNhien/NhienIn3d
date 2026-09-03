import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
const read = (p) => readFileSync(p, "utf8");

test("v3.18.0 dong bo current version scripts CI va grouped verify", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(read("VERSION").trim(), "3.18.0");
  assert.equal(pkg.version, "3.18.0");
  assert.equal(JSON.parse(read("apps/api/package.json")).version, "3.18.0");
  assert.equal(JSON.parse(read("apps/web/package.json")).version, "3.18.0");
  assert.equal(pkg.scripts.verify, "npm run verify:v318");
  assert.equal(pkg.scripts["verify:full"], "npm run verify:full:v318");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3180.mjs");
  assert.match(pkg.scripts["recovery:pitr"], /recovery-pitr-drill-v3180\.ps1/);
  assert.match(read(".github/workflows/ci.yml"), /e2e-runtime-v3180\.ps1/);
  assert.match(read("apps/api/src/suc-khoe/suc-khoe.controller.ts"), /v3\.18\.0/);
  assert.match(read("apps/api/src/main.ts"), /setVersion\("3\.18\.0"\)/);
  const compose = read("docker-compose.yml");
  assert.match(compose, /SYSTEM_SLO_PROBE_DESIRED_TARGET_VERSION: \${SYSTEM_SLO_PROBE_DESIRED_TARGET_VERSION:-3\.18\.0}/);
  assert.match(compose, /SYSTEM_OPS_SERVICE_RUNBOOKS_JSON: \${SYSTEM_OPS_SERVICE_RUNBOOKS_JSON:-}/);
});

test("v3.18.0 target-time PITR drill la opt-in va restore cluster co lap", () => {
  const script = read("scripts/recovery-pitr-drill-v3180.ps1");
  const verify = read("scripts/verify-v3180.ps1");
  assert.match(script, /SYSTEM_DB_PITR_DRILL_ENABLED/);
  assert.match(script, /pg_basebackup/);
  assert.match(script, /recovery_target_time/);
  assert.match(script, /recovery\.signal/);
  assert.match(script, /BEFORE_TARGET/);
  assert.match(script, /AFTER_TARGET/);
  assert.match(script, /pitr_restore_exercised = \$true/);
  assert.match(script, /isolated_restore = \$true/);
  assert.match(verify, /Target-time PITR drill \(opt-in\)/);
  assert.match(verify, /docker-compose\.pitr\.yml/);
});

test("v3.18.0 probe canary co health gate grace va auto rollback fail-safe", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const env = read(".env.example");
  assert.match(service, /probe_health_gate_status_v3180/);
  assert.match(service, /auto_rollback_probe_desired_state_v3180/);
  assert.match(service, /SYSTEM_HEALTH_GATE|SYSTEM_SLO_PROBE_HEALTH_GATE/);
  assert.match(service, /AUTO_ROLLBACK/);
  assert.match(service, /grace_seconds/);
  assert.match(service, /remote_code_execution: false/);
  assert.match(env, /SYSTEM_SLO_PROBE_HEALTH_GATE_AUTO_ROLLBACK=true/);
  assert.match(env, /SYSTEM_SLO_PROBE_HEALTH_GATE_GRACE_SECONDS=300/);
});

test("v3.18.0 postmortem approval action reminder va HTTPS service runbooks", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const dto = read("apps/api/src/quan-tri/dto/ops-v3180.dto.ts");
  assert.match(service, /duyet_incident_postmortem_v3180/);
  assert.match(service, /CHANGES_REQUESTED/);
  assert.match(service, /postmortem_summary_v3180/);
  assert.match(service, /POSTMORTEM_ACTION_REMINDER/);
  assert.match(service, /service_runbooks_v3180/);
  assert.match(service, /url\.protocol === "https:"/);
  assert.match(controller, /postmortem\/approval/);
  assert.match(dto, /APPROVED/);
  assert.match(dto, /CHANGES_REQUESTED/);
});

test("v3.18.0 COMPLETE DRAFT badge thu nho va canh giua", () => {
  const page = read("apps/web/app/quan-tri/ops/page.tsx");
  const css = read("apps/web/app/quan-tri/ops/page.module.css");
  const browser = read("scripts/e2e-browser-v3180.mjs");
  assert.match(page, /postmortemStatusBadge/);
  assert.match(page, /COMPLETE ·/);
  assert.match(page, /DRAFT/);
  assert.match(css, /\.postmortemStatusBadge\{/);
  assert.match(css, /height:20px/);
  assert.match(css, /justify-content:center/);
  assert.match(css, /align-items:center/);
  assert.match(css, /text-align:center/);
  assert.match(browser, /Badge COMPLETE\/DRAFT chưa được thu nhỏ và canh giữa v3\.18\.0/);
});

test("v3.18.0 giu 23 migration va khong them private key vao source", () => {
  assert.equal(readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter(x => x.isDirectory()).length, 23);
  assert.equal(existsSync("scripts/recovery-pitr-drill-v3180.ps1"), true);
  assert.doesNotMatch(read(".env.example"), /BEGIN PRIVATE KEY/);
});


test("v3.18.0 hotfix mysql2 va GHSA-rgwj-5xj2-c3m3 khong downgrade Prisma", () => {
  const root = JSON.parse(read("package.json"));
  const api = JSON.parse(read("apps/api/package.json"));
  const scanner = read("scripts/kiem-tra-mysql2-security.mjs");
  assert.equal(root.devDependencies.mysql2, "3.23.4");
  assert.equal(root.overrides.mysql2, "$mysql2");
  assert.match(scanner, /3, 23, 1/);
  assert.match(scanner, />=3\.23\.1: PASS/);
  assert.equal(api.devDependencies.prisma, "7.10.0");
  assert.equal(api.dependencies["@prisma/client"], "7.10.0");
});
