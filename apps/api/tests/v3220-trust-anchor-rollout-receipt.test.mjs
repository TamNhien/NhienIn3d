import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.22.0 API fail-closed trusted evidence va rollout decision receipt", () => {
  const service = read("src/quan-tri/quan-tri.service.ts");
  const controller = read("src/quan-tri/quan-tri.controller.ts");
  assert.match(controller, /trang_thai_ops_v3220/);
  assert.match(controller, /approve_probe_rollout_v3220/);
  assert.match(controller, /verify_recovery_evidence_v3220/);
  assert.match(service, /recovery_evidence_trust_config_v3220/);
  assert.match(service, /verify_recovery_evidence_bundle_v3220/);
  assert.match(service, /key_trusted: keyTrusted/);
  assert.match(service, /reason = "UNTRUSTED_SIGNING_KEY"/);
  assert.match(service, /probe_rollout_envelope_sha256_v3220/);
  assert.match(service, /probe_rollout_decision_receipt_sha256_v3220/);
  assert.match(service, /Rollout proposal envelope SHA-256 không hợp lệ/);
  assert.match(service, /DECISION_RECEIPT/);
  assert.match(service, /phien_ban: "3\.22\.0"/);
});
