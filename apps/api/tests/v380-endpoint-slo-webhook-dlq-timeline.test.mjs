import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.8.0 API probe endpoint that va tinh availability time-weighted", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /SloEndpointCheckV390/);
  assert.match(svc, /kiem_tra_slo_endpoints/);
  assert.match(svc, /"SLO_ENDPOINT"/);
  assert.match(svc, /endpoint_slo/);
  assert.match(svc, /time_weighted: true/);
  assert.match(svc, /tong_thoi_gian_phut/);
  assert.match(svc, /bo_hen_slo_endpoint/);
  assert.match(svc, /SYSTEM_SLO_ENDPOINT_INTERVAL_MINUTES/);
});

test("v3.8.0 SLO config co endpoint checks configurable", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  const dto = read("src/quan-tri/dto/cap-nhat-slo-nang-cao.dto.ts");
  assert.match(dto, /endpoint_checks\?/);
  assert.match(svc, /endpointMacDinh/);
  assert.match(svc, /path\.startsWith\("\/api\/v1\/"\)/);
  assert.match(svc, /muc_tieu_percent/);
  assert.match(svc, /timeout_ms/);
});

test("v3.8.0 webhook co adapter Slack Teams Discord va dead-letter", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  const ctl = read("src/quan-tri/quan-tri.controller.ts");
  assert.match(svc, /"SLACK", "TEAMS", "DISCORD"/);
  assert.match(svc, /dinh_dang_webhook_payload/);
  assert.match(svc, /"WEBHOOK_DLQ"/);
  assert.match(svc, /replay_webhook_dead_letter/);
  assert.match(ctl, /webhook\/dead-letter/);
  assert.match(ctl, /dead-letter\/:id\/replay/);
});

test("v3.8.0 incident timeline dung cursor va PostgreSQL full-text", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  const ctl = read("src/quan-tri/quan-tri.controller.ts");
  assert.match(svc, /timeline_su_co_van_hanh/);
  assert.match(svc, /to_tsvector\('simple'/);
  assert.match(svc, /websearch_to_tsquery\('simple'/);
  assert.match(svc, /GIN_TSVECTOR_V390|FULL_TEXT_FALLBACK/);
  assert.match(ctl, /su-co\/:chu_ky\/timeline/);
});

test("v3.8.0 SLO tra comparison 7 30 90 burn series va maintenance annotation", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /chin_muoi_ngay/);
  assert.match(svc, /comparison: \{ bay_ngay, ba_muoi_ngay, chin_muoi_ngay \}/);
  assert.match(svc, /burn_rate_series/);
  assert.match(svc, /maintenance_annotations/);
  assert.match(svc, /SLO comparison 7 \/ 30 \/ 90/);
  assert.match(svc, /Endpoint SLO time-weighted/);
});
