import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.20.0 dong bo version, current scripts, CI va grouped verify", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(read("VERSION").trim(), "3.20.0");
  assert.equal(pkg.version, "3.20.0");
  assert.equal(JSON.parse(read("apps/api/package.json")).version, "3.20.0");
  assert.equal(JSON.parse(read("apps/web/package.json")).version, "3.20.0");
  assert.equal(pkg.scripts.verify, "npm run verify:v320");
  assert.equal(pkg.scripts["verify:full"], "npm run verify:full:v320");
  assert.match(pkg.scripts["verify:v320"], /verify-v3200\.ps1/);
  assert.match(pkg.scripts["verify:full:v320"], /verify-v3200\.ps1 -Full/);
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3200.mjs");
  assert.equal(pkg.scripts["probe:agent"], "node scripts/probe-agent-v3200.mjs");
  assert.match(pkg.scripts["recovery:drill"], /recovery-drill-v3200\.ps1/);
  assert.match(pkg.scripts["recovery:pitr"], /recovery-pitr-drill-v3200\.ps1/);
  assert.equal(pkg.scripts["recovery:evidence"], "node scripts/recovery-evidence-v3200.mjs");
  assert.equal(pkg.scripts["recovery:evidence:keygen"], "node scripts/recovery-evidence-keygen-v3200.mjs");
  assert.match(read(".github/workflows/ci.yml"), /e2e-runtime-v3200\.ps1/);
  assert.match(read("apps/api/src/suc-khoe/suc-khoe.controller.ts"), /v3\.20\.0/);
  assert.match(read("apps/api/src/main.ts"), /setVersion\("3\.20\.0"\)/);
});

test("v3.20.0 production rollout approval co TTL two-person va audit diff", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const dto = read("apps/api/src/quan-tri/dto/ops-v3200.dto.ts");
  const compose = read("docker-compose.yml");
  assert.match(service, /probe_rollout_approval_config_v3200/);
  assert.match(service, /SYSTEM_SLO_PROBE_ROLLOUT_APPROVAL_TTL_MINUTES/);
  assert.match(service, /SYSTEM_SLO_PROBE_ROLLOUT_TWO_PERSON_RULE/);
  assert.match(service, /Two-person rule/);
  assert.match(service, /probe_rollout_diff_v3200/);
  assert.match(service, /base_revision/);
  assert.match(service, /expires_at/);
  assert.match(service, /remote_code_execution: false/);
  assert.match(controller, /probe-desired-state\/proposal\/approve/);
  assert.match(dto, /proposal_id/);
  assert.match(compose, /SYSTEM_SLO_PROBE_ROLLOUT_APPROVAL_REQUIRED/);
  assert.match(compose, /SYSTEM_SLO_PROBE_ROLLOUT_APPROVAL_TTL_MINUTES/);
});

test("v3.20.0 recovery evidence co SHA-256 va Ed25519 audit bundle khong lo private key", () => {
  const script = read("scripts/recovery-evidence-v3200.mjs");
  const keygen = read("scripts/recovery-evidence-keygen-v3200.mjs");
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  assert.match(script, /sha256/);
  assert.match(script, /Ed25519/i);
  assert.match(script, /SYSTEM_RECOVERY_EVIDENCE_ED25519_PRIVATE_KEY_B64/);
  assert.match(script, /recovery-evidence-bundle-v3200\.json/);
  assert.match(script, /public_key_fingerprint_sha256/);
  assert.match(keygen, /generateKeyPairSync\("ed25519"/);
  assert.match(service, /xuat_recovery_evidence_bundle_v3200/);
  assert.match(service, /evidence_sha256_supported: true/);
  assert.match(service, /evidence_ed25519_supported: true/);
  assert.doesNotMatch(read(".env.example"), /BEGIN PRIVATE KEY/);
  assert.doesNotMatch(read("apps/api/.env.example"), /BEGIN PRIVATE KEY/);
});

test("v3.20.0 remediation backlog co SLA P1-P4 on-call escalation va Excel", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  assert.match(service, /P1: 4, P2: 24, P3: 72, P4: 168/);
  assert.match(service, /SYSTEM_REMEDIATION_SLA_HOURS_JSON/);
  assert.match(service, /sla_status/);
  assert.match(service, /BREACHED/);
  assert.match(service, /on_call_hien_tai_v3160/);
  assert.match(service, /guiCanhBaoHeThong/);
  assert.match(service, /REMEDIATION_ESCALATION_V3200/);
  assert.match(service, /xuat_remediation_backlog_excel_v3200/);
  assert.match(controller, /ops\/remediation\/excel/);
  assert.match(controller, /ops\/remediation\/escalate/);
});

test("v3.20.0 giu 23 migrations va verify full co Docker preflight", () => {
  assert.equal(readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter(x => x.isDirectory()).length, 23);
  assert.equal(existsSync("scripts/verify-v3200.ps1"), true);
  const verify = read("scripts/verify-v3200.ps1");
  assert.match(verify, /docker info/);
  assert.match(verify, /Docker Engine READY/);
  assert.match(verify, /recovery-evidence-v3200\.mjs/);
  assert.match(verify, /e2e-runtime-v3200\.ps1/);
  assert.match(verify, /npm run e2e:browser/);
  assert.match(verify, /NhienIn3d v3\.20\.0 verification PASS/);
});
