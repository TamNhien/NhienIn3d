import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.21.0 historical grouped verify va evidence verifier duoc giu", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["verify:v321"], "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-v3210.ps1");
  assert.equal(pkg.scripts["verify:full:v321"], "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-v3210.ps1 -Full");
  assert.equal(existsSync("scripts/e2e-runtime-v3210.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v3210.mjs"), true);
  assert.equal(existsSync("scripts/recovery-evidence-v3210.mjs"), true);
  assert.equal(existsSync("scripts/recovery-evidence-verify-v3210.mjs"), true);
});

test("v3.21.0 rollout proposal co SHA-256 single-pending reject cancel va health preflight", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const dto = read("apps/api/src/quan-tri/dto/ops-v3210.dto.ts");
  const compose = read("docker-compose.yml");
  assert.match(service, /probe_rollout_proposal_sha256_v3210/);
  assert.match(service, /Đang có rollout proposal/);
  assert.match(service, /status: "REJECTED"/);
  assert.match(service, /status: "CANCELLED"/);
  assert.match(service, /SYSTEM_SLO_PROBE_ROLLOUT_APPROVAL_REQUIRE_HEALTHY/);
  assert.match(service, /approval_health_snapshot/);
  assert.match(controller, /proposal\/reject/);
  assert.match(controller, /proposal\/cancel/);
  assert.match(dto, /DecideProbeRolloutV3210Dto/);
  assert.match(compose, /SYSTEM_SLO_PROBE_ROLLOUT_APPROVAL_REQUIRE_HEALTHY/);
});

test("v3.21.0 recovery evidence verify doc lap va export fail-closed", () => {
  const generator = read("scripts/recovery-evidence-v3210.mjs");
  const verifier = read("scripts/recovery-evidence-verify-v3210.mjs");
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  assert.match(generator, /verification_required_before_export: true/);
  assert.match(verifier, /timingSafeEqual/);
  assert.match(verifier, /Ed25519 signature invalid/);
  assert.match(verifier, /Public key fingerprint mismatch/);
  assert.match(service, /verify_recovery_evidence_bundle_v3210\(bundle: Record<string, unknown>\): \{/);
  assert.match(service, /stored_sha256: string \| null/);
  assert.match(service, /MISSING_EVIDENCE[\s\S]{0,260}stored_sha256: null|stored_sha256: null[\s\S]{0,260}MISSING_EVIDENCE/);
  assert.match(service, /MISSING_BUNDLE[\s\S]{0,260}stored_sha256: null|stored_sha256: null[\s\S]{0,260}MISSING_BUNDLE/);
  assert.match(service, /không cho phép export audit bundle bị lỗi/);
  assert.match(controller, /recovery\/evidence-verify/);
});

test("v3.21.0 remediation ack fingerprint retry backoff L1-L3 va Excel", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const env = read(".env.example");
  assert.match(service, /REMEDIATION_ESCALATION_V3210/);
  assert.match(service, /remediation_fingerprint_v3210/);
  assert.match(service, /ACK_SNOOZED/);
  assert.match(service, /RETRY_BACKOFF/);
  assert.match(service, /level_1_hours: 0, level_2_hours: 24, level_3_hours: 72/);
  assert.match(service, /xuat_remediation_backlog_excel_v3210/);
  assert.match(controller, /remediation\/acknowledge/);
  assert.match(env, /SYSTEM_REMEDIATION_ACK_SNOOZE_HOURS=24/);
  assert.match(env, /SYSTEM_REMEDIATION_ESCALATION_RETRY_BASE_MINUTES=15/);
});

test("v3.21.0 giu 23 migrations va full verify co Docker evidence verifier Runtime Browser", () => {
  assert.ok(readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter((x) => x.isDirectory()).length >= 23);
  assert.equal(existsSync("scripts/verify-v3210.ps1"), true);
  const verify = read("scripts/verify-v3210.ps1");
  assert.match(verify, /docker info/);
  assert.match(verify, /Docker Engine READY/);
  assert.match(verify, /e2e-runtime-v3210\.ps1/);
  assert.match(verify, /recovery-evidence-v3210\.mjs/);
  assert.match(verify, /recovery-evidence-verify-v3210\.mjs/);
  assert.match(verify, /npm run e2e:browser/);
  assert.match(verify, /NhienIn3d v3\.21\.0 verification PASS/);
});
