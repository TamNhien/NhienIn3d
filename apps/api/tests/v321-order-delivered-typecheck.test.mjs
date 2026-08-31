import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.2.1 API cho Admin bo qua quy trinh de xac nhan da giao", () => {
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /admin_xac_nhan_da_giao/);
  assert.match(svc, /!chi_xac_nhan_doanh_thu && !admin_xac_nhan_da_giao/);
  assert.match(svc, /trang_thai_moi === TrangThaiDonHang\.HOAN_TAT/);
  assert.match(svc, /Không đủ tồn kho để khôi phục đơn đã hủy/u);
});

test("v3.2.1 API dung Prisma InputJsonObject cho audit diff", () => {
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /private tao_diff\([^)]*\): Prisma\.InputJsonObject/);
  assert.match(svc, /chi_tiet: this\.chuan_hoa_json_object\(chi_tiet\)/);
});
