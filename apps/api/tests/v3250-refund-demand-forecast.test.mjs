import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(p, "utf8");

test("v3.25.0 API hoan tien manual va forecast kho fail-safe", () => {
  const controller = read("src/quan-tri/quan-tri.controller.ts");
  const service = read("src/quan-tri/quan-tri.service.ts");
  const health = read("src/suc-khoe/suc-khoe.controller.ts");
  const main = read("src/main.ts");
  assert.match(controller, /ops_runtime\(\) \{ return this\.service\.trang_thai_ops_v3250\(\); \}/);
  assert.match(controller, /@Get\("don-hang\/hoan-tien-can-xu-ly"\)/);
  assert.match(controller, /@Post\("don-hang\/:id\/xac-nhan-hoan-tien"\)/);
  assert.match(service, /async danh_sach_hoan_tien_can_xu_ly_v3250/);
  assert.match(service, /async xac_nhan_hoan_tien_don_hang_v3250/);
  assert.match(service, /updateMany\([\s\S]*TrangThaiThanhToan\.DA_HOAN_TIEN/);
  assert.match(service, /gateway_auto_refund: false/);
  assert.match(service, /async goi_y_nhap_kho_v3250/);
  assert.match(service, /history_days = 30/);
  assert.match(service, /forecast_days = Math\.max\(1, Math\.min\(90/);
  assert.match(service, /cart_demand_is_reservation: false/);
  assert.match(service, /write_operation: false/);
  assert.match(health, /phien_ban: "v3\.25\.0"/);
  assert.match(main, /setVersion\("3\.25\.0"\)/);
});
