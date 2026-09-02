import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.11.0 API co signed distributed probe public controller", () => {
  const controller = read("../src/quan-tri/probe-agent.controller.ts");
  const service = read("../src/quan-tri/quan-tri.service.ts");
  assert.match(controller, /@Controller\("probe-agent"\)/);
  assert.match(controller, /x-nhienin3d-signature/);
  assert.match(service, /HMAC-SHA256-v3110/);
  assert.match(service, /timingSafeEqual/);
});

test("v3.11.0 API co region node SLO breakdown", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  assert.match(service, /by_region/);
  assert.match(service, /by_node/);
  assert.match(service, /persistent_samples/);
});

test("v3.11.0 API co DLQ keyring replay jobs retry budget", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const controller = read("../src/quan-tri/quan-tri.controller.ts");
  assert.match(service, /dlq_keyring_v3110/);
  assert.match(service, /tieu_thu_retry_budget_v3110/);
  assert.match(service, /tao_webhook_replay_job_v3110/);
  assert.match(controller, /keyring\/rotate/);
  assert.match(controller, /replay-jobs/);
});

test("v3.11.0 API co archive preview verify prune va on-call routing", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const controller = read("../src/quan-tri/quan-tri.controller.ts");
  assert.match(service, /kiem_tra_archive_ops_v3110/);
  assert.match(service, /verify_before_prune: true/);
  assert.match(service, /archiveSha !== preview\.sha256/);
  assert.match(service, /upsert_escalation_policy_v3110/);
  assert.match(controller, /ops\/archive\/preview/);
  assert.match(controller, /ops\/on-call/);
});
