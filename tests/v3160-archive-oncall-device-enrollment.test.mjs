import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
const read = (p) => readFileSync(p, "utf8");

test("v3.16.0 dong bo version scripts CI Health OpenAPI va grouped verify", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(read("VERSION").trim(), "3.16.0");
  assert.equal(pkg.version, "3.16.0");
  assert.equal(JSON.parse(read("apps/api/package.json")).version, "3.16.0");
  assert.equal(JSON.parse(read("apps/web/package.json")).version, "3.16.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3160.mjs");
  assert.equal(pkg.scripts["probe:agent"], "node scripts/probe-agent-v3160.mjs");
  assert.match(pkg.scripts["probe:fleet"], /probe-fleet-v3160\.ps1/);
  assert.match(pkg.scripts["verify:v316"], /verify-v3160\.ps1/);
  assert.equal(pkg.scripts.verify, "npm run verify:v316");
  assert.equal(pkg.scripts["verify:full"], "npm run verify:full:v316");
  assert.equal(existsSync("scripts/e2e-runtime-v3160.ps1"), true);
  assert.match(read(".github/workflows/ci.yml"), /e2e-runtime-v3160\.ps1/);
  assert.match(read("apps/api/src/suc-khoe/suc-khoe.controller.ts"), /phien_ban: "v3\.16\.0"/);
  assert.match(read("apps/api/src/main.ts"), /setVersion\("3\.16\.0"\)/);
});

test("v3.16.0 archive portability co JSONL GZIP S3 allowlist va restore replay dry-run", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const env = read(".env.example");
  const compose = read("docker-compose.yml");
  const page = read("apps/web/app/quan-tri/ops/page.tsx");
  assert.match(service, /xuat_archive_bundle_v3160/);
  assert.match(service, /gzipSync\(raw, \{ level: 9 \}\)/);
  assert.match(service, /format: "nhienin3d-ops-archive-v3160"/);
  assert.match(service, /upload_archive_presigned_v3160/);
  assert.match(service, /url\.protocol !== "https:"/);
  assert.match(service, /SYSTEM_OPS_ARCHIVE_S3_ALLOWED_HOSTS/);
  assert.match(service, /restore_archive_partition_v3160/);
  assert.match(service, /ON CONFLICT \("id"\) DO NOTHING/);
  assert.match(controller, /ops\/archive\/export\/presigned/);
  assert.match(controller, /ops\/archive\/restore/);
  assert.match(env, /SYSTEM_OPS_ARCHIVE_RETENTION_CLASS=STANDARD/);
  assert.match(compose, /SYSTEM_OPS_ARCHIVE_S3_ALLOWED_HOSTS/);
  assert.match(page, /Tải bundle/);
});

test("v3.16.0 on-call co ICS import export override absence handoff va escalation ack", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const page = read("apps/web/app/quan-tri/ops/page.tsx");
  const lib = read("apps/web/lib/quan-tri.ts");
  for (const marker of ["xuat_on_call_calendar_v3160", "import_on_call_calendar_v3160", "tao_on_call_override_v3160", "handoff_on_call_v3160", "acknowledge_escalation_v3160"]) assert.match(service, new RegExp(marker));
  assert.match(service, /OPS_ON_CALL_OVERRIDES_V3160/);
  assert.match(service, /BEGIN:VCALENDAR/);
  assert.match(controller, /ops\/on-call\/calendar\/import/);
  assert.match(controller, /ops\/on-call\/overrides/);
  assert.match(controller, /escalation-ack/);
  assert.match(page, /Xuất ICS/);
  assert.match(page, />Handoff</);
  assert.match(lib, /OpsOnCallHandoffAdmin/);
});

test("v3.16.0 enrollment bind device hash va rotation policy khong lo raw device identity", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/probe-agent.controller.ts");
  const env = read(".env.example");
  const agent = read("scripts/probe-agent-v3160.mjs");
  const enroll = read("scripts/probe-enroll-v3160.mjs");
  assert.match(service, /SYSTEM_SLO_ENROLLMENT_REQUIRE_DEVICE_ID/);
  assert.match(service, /SYSTEM_SLO_ENROLLMENT_ROTATION_DAYS/);
  assert.match(service, /createHash\("sha256"\)\.update\(`device:\$\{deviceId\}`\)/);
  assert.match(service, /ED25519_ROTATION_DUE/);
  assert.match(service, /raw_device_id_exposed: false/);
  assert.match(controller, /x-nhienin3d-device-id/);
  assert.match(env, /NH3D_PROBE_DEVICE_ID=/);
  assert.match(agent, /x-nhienin3d-device-id/);
  assert.match(enroll, /x-nhienin3d-device-id/);
  assert.doesNotMatch(service, /device_id:\s*deviceId/);
  assert.doesNotMatch(agent, /console\.log\([^\n]*deviceId/);
  assert.doesNotMatch(enroll, /console\.log\([^\n]*deviceId/);
});

test("v3.16.0 giu 23 migration va verify full gom runtime browser", () => {
  const verify = read("scripts/verify-v3160.ps1");
  assert.match(verify, /npm install/);
  assert.match(verify, /npm test/);
  assert.match(verify, /npm run typecheck/);
  assert.match(verify, /npm run build/);
  assert.match(verify, /backup-db\.ps1/);
  assert.match(verify, /docker compose build --no-cache migrate api web/);
  assert.match(verify, /e2e-runtime-v3160\.ps1/);
  assert.match(verify, /npm run e2e:browser/);
  assert.equal(readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter(x => x.isDirectory()).length, 23);
});

test("v3.16.0 Browser E2E scope device-bound vao Managed probe fleet de tranh strict locator trung", () => {
  const browser = read("scripts/e2e-browser-v3160.mjs");
  assert.match(browser, /managedFleetPanel/);
  assert.match(browser, /getByRole\("heading", \{ name: "Managed probe fleet", exact: true \}\)/);
  assert.match(browser, /locator\("xpath=ancestor::section\[1\]"\)/);
  assert.match(browser, /managedFleetPanel\.getByText\(\/Ed25519 lifecycle:\.\*device-bound\/\)/);
  assert.doesNotMatch(browser, /page\.getByText\(\/device-bound\/\)\.waitFor\(\)/);
});
