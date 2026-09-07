import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.26.0 API receipt chain va recovery revoked-key fail-closed", () => {
  const service = read("src/quan-tri/quan-tri.service.ts");
  const controller = read("src/quan-tri/quan-tri.controller.ts");
  const health = read("src/suc-khoe/suc-khoe.controller.ts");
  const main = read("src/main.ts");

  assert.match(controller, /ops_runtime\(\) \{ return this\.service\.trang_thai_ops_v3280\(\); \}/);
  assert.match(controller, /cap_nhat_probe_desired_state_v3280/);
  assert.match(controller, /approve_probe_rollout_v3280/);
  assert.match(controller, /reject_probe_rollout_v3280/);
  assert.match(controller, /cancel_probe_rollout_v3280/);
  assert.match(controller, /verify_recovery_evidence_v3280/);
  assert.match(controller, /xuat_recovery_evidence_bundle_v3280/);

  assert.match(service, /type ProbeRolloutReceiptChainEntryV3230/);
  assert.match(service, /probe_rollout_receipt_entry_sha256_v3230/);
  assert.match(service, /lay_probe_rollout_receipt_chain_v3230/);
  assert.match(service, /append_probe_rollout_receipt_chain_v3230/);
  assert.match(service, /receipt_chain_valid/);
  assert.match(service, /receipt_chain_head_sha256/);
  assert.match(service, /MALFORMED_ENTRY/);
  assert.match(service, /STORED_HEAD_MISMATCH/);
  assert.match(service, /Rollout decision receipt chain không hợp lệ/);

  assert.match(service, /recovery_evidence_revocation_config_v3230/);
  assert.match(service, /verify_recovery_evidence_bundle_v3230/);
  assert.match(service, /key_revoked: keyRevoked/);
  assert.match(service, /reason: keyRevoked \? "REVOKED_SIGNING_KEY"/);
  assert.match(service, /audit_bundle_revocation_fail_closed/);

  assert.match(health, /phien_ban: "v3\.28\.0"/);
  assert.match(main, /setVersion\("3\.28\.0"\)/);
  assert.match(service, /async trang_thai_ops_v3230\(\)/);
});
