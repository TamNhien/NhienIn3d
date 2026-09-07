import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.26.0 API co shift overlap guard va replenishment plan read-only", () => {
  const service = read("src/quan-tri/quan-tri.service.ts");
  const controller = read("src/quan-tri/quan-tri.controller.ts");
  const health = read("src/suc-khoe/suc-khoe.controller.ts");
  const main = read("src/main.ts");

  assert.match(controller, /ops_runtime\(\) \{ return this\.service\.trang_thai_ops_v3270\(\); \}/);
  assert.match(controller, /@Get\("phan-ca\/xung-dot"\)/);
  assert.match(controller, /@Get\("kho\/goi-y-nhap"\)/);
  assert.match(controller, /@Get\("kho\/goi-y-nhap\/excel"\)/);
  assert.match(service, /async danh_sach_xung_dot_phan_ca_v3240/);
  assert.match(service, /return a_bat_dau < b_ket_thuc && a_ket_thuc > b_bat_dau/);
  assert.match(service, /async goi_y_nhap_kho_v3240/);
  assert.match(service, /nguon_nha_cung_cap/);
  assert.match(service, /auto_purchase_order: false/);
  assert.match(service, /no_database_migration: true/);
  assert.match(health, /phien_ban: "v3\.27\.0"/);
  assert.match(main, /setVersion\("3\.27\.0"\)/);
});
