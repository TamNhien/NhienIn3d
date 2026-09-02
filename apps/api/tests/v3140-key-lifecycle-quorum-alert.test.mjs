import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.14.0 API probe key lifecycle va runtime safe metadata", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const controller = read("../src/quan-tri/quan-tri.controller.ts");
  assert.match(service, /cau_hinh_probe_agent_public_keys_v3140/);
  assert.match(service, /active_keys/);
  assert.match(service, /revoked_keys/);
  assert.match(service, /expired_keys/);
  assert.match(service, /expiring_soon_keys/);
  assert.match(service, /secret_values_exposed: false/);
  assert.match(controller, /trang_thai_ops_v3160/);
});

test("v3.14.0 API quorum alert ke thua alert pipeline va version", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const health = read("../src/suc-khoe/suc-khoe.controller.ts");
  const main = read("../src/main.ts");
  assert.match(service, /quorum_alerting/);
  assert.match(service, /canh_bao_quorum/);
  assert.match(service, /SYSTEM_SLO_QUORUM_ALERT_ENABLED/);
  assert.match(health, /phien_ban: "v3\.16\.0"/);
  assert.match(main, /setVersion\("3\.16\.0"\)/);
});
