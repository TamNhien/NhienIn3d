import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.23.0 receipt hash chain + recovery revoked-key fail-closed", () => {
  const pkg = JSON.parse(read("package.json"));
  const apiPkg = JSON.parse(read("apps/api/package.json"));
  const webPkg = JSON.parse(read("apps/web/package.json"));
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const verifier = read("scripts/recovery-evidence-verify-v3260.mjs");
  const generator = read("scripts/recovery-evidence-v3260.mjs");
  const env = read(".env.example");
  const apiEnv = read("apps/api/.env.example");
  const compose = read("docker-compose.yml");
  const readme = read("README.md");

  assert.equal(read("VERSION").trim(), "3.27.0");
  assert.equal(pkg.version, "3.27.0");
  assert.equal(apiPkg.version, "3.27.0");
  assert.equal(webPkg.version, "3.27.0");
  assert.equal(pkg.scripts.verify, "npm run verify:v327");
  assert.equal(pkg.scripts["verify:full"], "npm run verify:full:v327");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3270.mjs");
  assert.equal(pkg.scripts["recovery:evidence"], "node scripts/recovery-evidence-v3270.mjs");
  assert.equal(pkg.scripts["recovery:evidence:verify"], "node scripts/recovery-evidence-verify-v3270.mjs");

  assert.match(controller, /trang_thai_ops_v3270/);
  assert.match(controller, /cap_nhat_probe_desired_state_v3270/);
  assert.match(controller, /approve_probe_rollout_v3270/);
  assert.match(controller, /xuat_recovery_evidence_bundle_v3270/);
  assert.match(controller, /verify_recovery_evidence_v3270/);

  assert.match(service, /PROBE_ROLLOUT_RECEIPT_CHAIN_V3230/);
  assert.match(service, /probe_rollout_receipt_chain_verify_v3230/);
  assert.match(service, /decision_receipt_hash_chain: true/);
  assert.match(service, /decision_receipt_chain_fail_closed: true/);
  assert.match(service, /SEQUENCE_GAP/);
  assert.match(service, /PREVIOUS_HASH_MISMATCH/);
  assert.match(service, /ENTRY_SHA256_MISMATCH/);
  assert.match(service, /MALFORMED_ENTRY/);
  assert.match(service, /STORED_LENGTH_MISMATCH/);
  assert.match(service, /STORED_HEAD_MISMATCH/);
  assert.match(service, /chặn approve fail-closed/);
  assert.match(service, /SYSTEM_SLO_PROBE_ROLLOUT_RECEIPT_HISTORY_LIMIT/);

  assert.match(service, /SYSTEM_RECOVERY_EVIDENCE_REVOKED_KEYS_JSON/);
  assert.match(service, /REVOKED_SIGNING_KEY/);
  assert.match(service, /revocation_fail_closed: true/);
  assert.match(service, /audit_bundle_revocation_fail_closed: true/);
  assert.match(verifier, /Revoked signing key/);
  assert.match(verifier, /SYSTEM_RECOVERY_EVIDENCE_REVOKED_KEYS_JSON/);
  assert.match(generator, /revoked_key_fail_closed: true/);

  for (const src of [env, apiEnv]) {
    assert.match(src, /SYSTEM_SLO_PROBE_ROLLOUT_RECEIPT_HISTORY_LIMIT=100/);
    assert.match(src, /SYSTEM_RECOVERY_EVIDENCE_REVOKED_KEYS_JSON=/);
  }
  assert.match(compose, /SYSTEM_SLO_PROBE_ROLLOUT_RECEIPT_HISTORY_LIMIT/);
  assert.match(compose, /SYSTEM_RECOVERY_EVIDENCE_REVOKED_KEYS_JSON/);
  assert.match(readme, /## v3\.26\.0/);
  assert.match(readme, /tamper-evident decision receipt hash chain/);
  assert.match(readme, /revoked signing-key denylist/);

  assert.equal(readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter((x) => x.isDirectory()).length, 23);
  assert.equal(existsSync("scripts/verify-v3220.ps1"), true);
  assert.equal(existsSync("scripts/verify-v3230.ps1"), true);
});
