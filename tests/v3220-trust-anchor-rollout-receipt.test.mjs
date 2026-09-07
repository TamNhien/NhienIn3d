import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.22.0 trusted recovery key rollout envelope decision receipt va current verify", () => {
  const pkg = JSON.parse(read("package.json"));
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const generator = read("scripts/recovery-evidence-v3220.mjs");
  const verifier = read("scripts/recovery-evidence-verify-v3220.mjs");
  const env = read(".env.example");
  const compose = read("docker-compose.yml");
  assert.equal(read("VERSION").trim(), "3.26.0");
  assert.equal(pkg.version, "3.26.0");
  assert.equal(pkg.scripts.verify, "npm run verify:v326");
  assert.equal(pkg.scripts["verify:full"], "npm run verify:full:v326");
  assert.equal(pkg.scripts["recovery:evidence:verify"], "node scripts/recovery-evidence-verify-v3260.mjs");
  assert.match(controller, /trang_thai_ops_v3260/);
  assert.match(service, /SYSTEM_RECOVERY_EVIDENCE_TRUSTED_KEYS_JSON/);
  assert.match(service, /SYSTEM_RECOVERY_EVIDENCE_REQUIRE_TRUSTED_KEY/);
  assert.match(service, /UNTRUSTED_SIGNING_KEY/);
  assert.match(service, /proposal_envelope_sha256/);
  assert.match(service, /decision_receipt_sha256/);
  assert.match(service, /decision_receipt_fail_closed/);
  assert.match(generator, /loadProjectEnv/);
  assert.match(generator, /external_trust_anchor_required_for_signed_bundle: true/);
  assert.match(verifier, /CURRENT_SIGNING_KEY/);
  assert.match(verifier, /TRUST_STORE/);
  assert.match(verifier, /Untrusted signing key/);
  assert.match(env, /SYSTEM_RECOVERY_EVIDENCE_REQUIRE_TRUSTED_KEY=true/);
  assert.match(env, /SYSTEM_RECOVERY_EVIDENCE_TRUSTED_KEYS_JSON=/);
  assert.match(compose, /SYSTEM_RECOVERY_EVIDENCE_TRUSTED_KEYS_JSON/);
  assert.equal(readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter((x) => x.isDirectory()).length, 23);
  assert.equal(existsSync("scripts/verify-v3210.ps1"), true);
  assert.equal(existsSync("scripts/verify-v3220.ps1"), true);
  assert.equal(existsSync("scripts/verify-v3230.ps1"), true);
});
