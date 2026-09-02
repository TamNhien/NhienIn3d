import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
const read = (p) => readFileSync(p, "utf8");

test("v3.17.0 dong bo version current scripts recovery drill va grouped verify", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(read("VERSION").trim(), "3.17.0");
  assert.equal(pkg.version, "3.17.0");
  assert.equal(JSON.parse(read("apps/api/package.json")).version, "3.17.0");
  assert.equal(JSON.parse(read("apps/web/package.json")).version, "3.17.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3170.mjs");
  assert.equal(pkg.scripts["probe:agent"], "node scripts/probe-agent-v3170.mjs");
  assert.match(pkg.scripts["recovery:drill"], /recovery-drill-v3170\.ps1/);
  assert.equal(pkg.scripts.verify, "npm run verify:v317");
  assert.equal(pkg.scripts["verify:full"], "npm run verify:full:v317");
  assert.match(read("scripts/verify-v3170.ps1"), /recovery-drill-v3170\.ps1/);
  assert.match(read(".github/workflows/ci.yml"), /e2e-runtime-v3170\.ps1/);
  assert.match(read("apps/api/src/suc-khoe/suc-khoe.controller.ts"), /phien_ban: "v3\.17\.0"/);
  assert.match(read("apps/api/src/main.ts"), /setVersion\("3\.17\.0"\)/);
});

test("v3.17.0 Admin system health dong bo phien_ban runtime", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const start = service.indexOf("async suc_khoe_he_thong");
  const end = service.indexOf("async ", start + 10);
  const healthMethod = service.slice(start, end > start ? end : undefined);
  assert.match(healthMethod, /phien_ban:\s*"3\.17\.0"/);
  assert.doesNotMatch(healthMethod, /phien_ban:\s*"3\.16\.0"/);
});

test("v3.17.0 Runtime E2E giu on-call contract v3160 thay vi doi ten property khong ton tai", () => {
  const runtime = read("scripts/e2e-runtime-v3170.ps1");
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const webLib = read("apps/web/lib/quan-tri.ts");
  assert.match(runtime, /opsRuntime\.on_call_v3160\.calendar_import_export/);
  assert.match(runtime, /opsRuntime\.on_call_v3160\.handoff_report/);
  assert.doesNotMatch(runtime, /opsRuntime\.on_call_v3170/);
  assert.match(service, /on_call_v3160:\s*\{/);
  assert.match(webLib, /on_call_v3160\?/);
});

test("v3.17.0 recovery readiness co optional WAL archive va khong overclaim target-time PITR", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const drill = read("scripts/recovery-drill-v3170.ps1");
  const compose = read("docker-compose.pitr.yml");
  const env = read(".env.example");
  assert.match(service, /recovery_readiness_v3170/);
  assert.match(service, /pg_stat_archiver/);
  assert.match(service, /pitr_restore_exercised/);
  assert.match(compose, /archive_mode=on/);
  assert.match(compose, /archive_command=/);
  assert.match(drill, /pg_switch_wal/);
  assert.match(drill, /pitr_restore_exercised = \$false/);
  assert.match(env, /SYSTEM_DB_RECOVERY_RPO_TARGET_MINUTES=60/);
  assert.match(env, /SYSTEM_DB_RECOVERY_RTO_TARGET_MINUTES=30/);
});

test("v3.17.0 signed probe desired-state co canary rollback va remote code execution OFF", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const agent = read("scripts/probe-agent-v3170.mjs");
  assert.match(service, /lay_probe_desired_state_v3170/);
  assert.match(service, /rollback_probe_desired_state_v3170/);
  assert.match(service, /probe_rollout_bucket_v3170/);
  assert.match(service, /remote_code_execution: false/);
  assert.match(controller, /ops\/probe-desired-state\/rollback/);
  assert.match(service, /SYSTEM_SLO_PROBE_DESIRED_SIGNING_PRIVATE_KEY/);
  assert.match(service, /signPayload\(null/);
  assert.match(service, /SIGNING_REQUIRED/);
  assert.match(agent, /verifyDesiredState/);
  assert.match(agent, /verifyPayload\(null/);
  assert.match(agent, /missing-public-key/);
  assert.match(agent, /stale-signature/);
  assert.match(agent, /signature=VERIFIED/);
  assert.match(read(".env.example"), /SYSTEM_SLO_PROBE_DESIRED_SIGNING_PRIVATE_KEY=/);
  assert.match(read(".env.example"), /NH3D_PROBE_DESIRED_STATE_PUBLIC_KEY_FILE=/);
  assert.match(read("docker-compose.yml"), /SYSTEM_SLO_PROBE_DESIRED_SIGNING_PRIVATE_KEY/);
  assert.match(agent, /remote-code-execution=OFF/);
  assert.doesNotMatch(agent, /child_process|exec\(|spawn\(/);
});

test("v3.17.0 incident postmortem co timeline snapshot HTTPS runbook va action items", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  assert.match(service, /timeline_snapshot_v3170/);
  assert.match(service, /lay_incident_postmortem_v3170/);
  assert.match(service, /luu_incident_postmortem_v3170/);
  assert.match(service, /url\.protocol !== "https:"/);
  assert.match(service, /action_items/);
  assert.match(controller, /su-co\/:chu_ky\/postmortem/);
});

test("v3.17.0 giu 23 migration", () => {
  assert.equal(readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter(x => x.isDirectory()).length, 23);
  assert.equal(existsSync("docker-compose.pitr.yml"), true);
});
