import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.26.0 API co refund SLA Excel, supplier grouping va atomic cycle count", () => {
  const controller = read("src/quan-tri/quan-tri.controller.ts");
  const service = read("src/quan-tri/quan-tri.service.ts");
  const dto = read("src/quan-tri/dto/kiem-ke-kho-v3260.dto.ts");
  assert.match(controller, /danh_sach_hoan_tien_can_xu_ly_v3260/);
  assert.match(controller, /xuat_hoan_tien_can_xu_ly_excel_v3260/);
  assert.match(controller, /kiem_tra_kiem_ke_kho_v3260/);
  assert.match(controller, /ap_dung_kiem_ke_kho_v3260/);
  assert.match(service, /refund_sla_hours_v3260/);
  assert.match(service, /refund_due_at/);
  assert.match(service, /NCC_NGUNG_HOAT_DONG/);
  assert.match(service, /CHUA_GAN_NCC/);
  assert.match(service, /ready_to_send/);
  assert.match(service, /updateMany\(\{ where: \{ id: current\.id, so_luong_ton: input\.ton_he_thong \}/);
  assert.match(service, /transaction kiểm kê đã hủy toàn bộ/);
  assert.match(dto, /@IsUUID/);
  assert.match(dto, /@ArrayMaxSize\(200\)/);
});
