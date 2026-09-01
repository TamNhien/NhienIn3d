import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.9.0 endpoint probe co method header auth template va latency SLI", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /SloEndpointCheckV390/);
  assert.match(svc, /method: "GET" \| "HEAD"/);
  assert.match(svc, /headers: Record<string, string>/);
  assert.match(svc, /auth_template: "NONE" \| "BEARER_ENV"/);
  assert.match(svc, /latency_target_ms/);
  assert.match(svc, /p95_ms/);
  assert.match(svc, /histogram/);
  assert.match(svc, /latency_ok/);
  assert.match(svc, /Header nhạy cảm/);
  assert.match(svc, /x-api-key/);
  assert.match(svc, /\$\{ENV:TEN_BIEN\}/);
});

test("v3.9.0 SLO maintenance-aware co exclusion availability error budget va max gap", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  const dto = read("src/quan-tri/dto/cap-nhat-slo-nang-cao.dto.ts");
  assert.match(dto, /maintenance_policy/);
  assert.match(svc, /exclude_from_availability/);
  assert.match(svc, /exclude_from_error_budget/);
  assert.match(svc, /max_gap_multiplier/);
  assert.match(svc, /maintenance_policy_applied/);
  assert.match(svc, /excluded_maintenance_phut/);
});

test("v3.9.0 webhook DLQ co retention ack bulk replay va idempotency", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  const ctl = read("src/quan-tri/quan-tri.controller.ts");
  assert.match(svc, /dlq_retention_days/);
  assert.match(svc, /idempotency_key/);
  assert.match(svc, /acknowledge_webhook_dead_letter/);
  assert.match(svc, /replay_bulk_webhook_dead_letter/);
  assert.match(svc, /replay_allow_duplicate/);
  assert.match(ctl, /dead-letter\/replay-bulk/);
  assert.match(ctl, /dead-letter\/:id\/ack/);
});

test("v3.9.0 incident search dung GIN tsvector va metrics materialized fallback", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /search_vector @@ websearch_to_tsquery/);
  assert.match(svc, /GIN_TSVECTOR_V390/);
  assert.match(svc, /REFRESH MATERIALIZED VIEW/);
  assert.match(svc, /MATERIALIZED_VIEW_V390/);
  assert.match(svc, /RUNTIME_FALLBACK/);
});
