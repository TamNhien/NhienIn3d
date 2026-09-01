import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.6.0 co maintenance window va webhook alert env", () => {
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  const ctl = doc("apps/api/src/quan-tri/quan-tri.controller.ts");
  const env = doc(".env.example");
  const apiEnv = doc("apps/api/.env.example");
  const compose = doc("docker-compose.yml");
  const composeHttps = doc("docker-compose.https.yml");
  assert.match(ctl, /he-thong\/bao-tri/);
  assert.match(svc, /BAO_TRI_HE_THONG_CAU_HINH/);
  assert.match(svc, /dang_bao_tri/);
  assert.match(svc, /SYSTEM_ALERT_WEBHOOK_ENABLED/);
  for (const src of [env, apiEnv, compose, composeHttps]) {
    assert.match(src, /SYSTEM_ALERT_WEBHOOK_ENABLED/);
    assert.match(src, /SYSTEM_ALERT_WEBHOOK_URL/);
  }
});

test("v3.6.0 co error budget burn-rate va Incident Excel", () => {
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  const ctl = doc("apps/api/src/quan-tri/quan-tri.controller.ts");
  assert.match(svc, /ngan_sach_loi/);
  assert.match(svc, /tinh_burn\(1/);
  assert.match(svc, /tinh_burn\(6/);
  assert.match(svc, /tinh_burn\(24/);
  assert.match(ctl, /he-thong\/su-co\/excel/);
  assert.match(ctl, /he-thong\/su-co\/:chu_ky\/excel/);
});

test("v3.6.0 runtime browser E2E co persistence an toan", () => {
  assert.equal(existsSync("scripts/e2e-runtime-v360.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v360.mjs"), true);
  const browser = doc("scripts/e2e-browser-v360.mjs");
  assert.match(browser, /SLO update \+ reload persistence/);
  assert.match(browser, /E2E_MUTATE_INCIDENT/);
  assert.match(browser, /Tiếp nhận incident/);
  assert.match(browser, /Đánh dấu đã khắc phục/);
});
