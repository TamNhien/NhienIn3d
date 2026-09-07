import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.26.0 dong bo current source, refund SLA va cycle count", () => {
  const pkg = JSON.parse(read("package.json"));
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const compose = read("docker-compose.yml");
  assert.equal(read("VERSION").trim(), "3.28.0");
  assert.equal(pkg.version, "3.28.0");
  assert.equal(pkg.scripts.verify, "npm run verify:v328");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3280.mjs");
  assert.match(controller, /trang_thai_ops_v3280/);
  assert.match(controller, /hoan-tien-can-xu-ly\/excel/);
  assert.match(controller, /kho\/kiem-ke\/kiem-tra/);
  assert.match(controller, /kho\/kiem-ke\/ap-dung/);
  assert.match(service, /SYSTEM_REFUND_RECONCILIATION_SLA_HOURS/);
  assert.match(service, /"QUA_HAN"/);
  assert.match(service, /"SAP_DEN_HAN"/);
  assert.match(service, /optimistic_lock: true/);
  assert.match(service, /atomic_transaction: true/);
  assert.match(service, /ADMIN_KIEM_KE_TON_KHO/);
  assert.match(service, /ADMIN_AP_DUNG_KIEM_KE_KHO/);
  assert.match(service, /trang_thai_nhom/);
  assert.match(compose, /SYSTEM_REFUND_RECONCILIATION_SLA_HOURS/);
  assert.match(read(".env.example"), /SYSTEM_REFUND_RECONCILIATION_SLA_HOURS=24/);
});
