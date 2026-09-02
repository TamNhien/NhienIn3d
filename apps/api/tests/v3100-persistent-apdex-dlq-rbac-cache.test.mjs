import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.10.0 endpoint probe persist sample theo agent region va tinh Apdex", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /cau_hinh_probe_agent_v3100/);
  assert.match(svc, /SYSTEM_SLO_PROBE_AGENT_ID/);
  assert.match(svc, /sloEndpointMau\.create/);
  assert.match(svc, /apdex_bucket/);
  assert.match(svc, /SATISFIED/);
  assert.match(svc, /TOLERATING/);
  assert.match(svc, /FRUSTRATED/);
  assert.match(svc, /persistent_samples/);
  assert.match(svc, /probe_agents/);
  assert.match(svc, /apdex: \{/);
});

test("v3.10.0 webhook DLQ payload dung AES-256-GCM reference thay plaintext history", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /createCipheriv\("aes-256-gcm"/);
  assert.match(svc, /createDecipheriv\("aes-256-gcm"/);
  assert.match(svc, /getAuthTag\(\)/);
  assert.match(svc, /payload_ciphertext/);
  assert.match(svc, /payload_ref/);
  assert.match(svc, /payload_encrypted/);
  assert.match(svc, /webhookDlqPayload\.create/);
  const deadLetterBlock = svc.slice(svc.indexOf("private async luu_dead_letter_ma_hoa_v3100"), svc.indexOf("private async gui_webhook_canh_bao"));
  assert.doesNotMatch(deadLetterBlock, /chi_tiet:[\s\S]*\bpayload\s*[,}]/);
});

test("v3.10.0 DLQ scheduled retry retention va Ops metrics cache scheduler", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /xu_ly_webhook_dlq_job/);
  assert.match(svc, /CHO_RETRY/);
  assert.match(svc, /RETRY_THAT_BAI/);
  assert.match(svc, /retry_tiep_theo_luc/);
  assert.match(svc, /refresh_ops_metrics_cache/);
  assert.match(svc, /opsMetricCache\.upsert/);
  assert.match(svc, /cleanup_ops_retention/);
  assert.match(svc, /SYSTEM_OPS_HISTORY_RETENTION_DAYS/);
  assert.match(svc, /SCHEDULER_CACHE_V3100/);
});

test("v3.10.0 Ops RBAC co viewer on-call service owner va escalation", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  const ctl = read("src/quan-tri/ops.controller.ts");
  const adminCtl = read("src/quan-tri/quan-tri.controller.ts");
  assert.match(svc, /kiem_tra_quyen_ops/);
  assert.match(svc, /OPS_VIEWER/);
  assert.match(svc, /ON_CALL/);
  assert.match(svc, /SERVICE_OWNER/);
  assert.match(svc, /cap_escalation/);
  assert.match(svc, /ForbiddenException/);
  assert.match(ctl, /@Controller\("ops"\)/);
  assert.match(ctl, /@Get\("dashboard"\)/);
  assert.match(ctl, /tiep-nhan/);
  assert.match(ctl, /khac-phuc/);
  assert.match(adminCtl, /he-thong\/ops\/phan-cong/);
});

test("v3.10.0 Ops runtime khong lo khoa ma hoa raw", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  const start = svc.indexOf("async trang_thai_ops_v3100");
  const end = svc.indexOf("private async", start + 10);
  const block = svc.slice(start, end > start ? end : start + 3000);
  assert.match(block, /key_id/);
  assert.match(block, /key_source/);
  assert.doesNotMatch(block, /\.key\b/);
});
