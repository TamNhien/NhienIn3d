import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.3.2 API uu tien COD dang cho thay vi chi giao dich moi nhat", () => {
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /const thanh_toan_can_chot/);
  assert.match(svc, /ma_phuong_thuc === "COD"/);
  assert.match(svc, /where: \{ id: thanh_toan_can_chot\.id \}/);
  assert.match(svc, /giao_dich_da_ghi_nhan_sau/);
  assert.doesNotMatch(svc, /!thanh_toan_da_ghi_nhan && thanh_toan_hien_tai\?\.trang_thai === TrangThaiThanhToan\.CHO_THANH_TOAN/);
});

test("v3.3.2 API tong quan tra rieng so don da giao", () => {
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /donDaGiao30Ngay/);
  assert.match(svc, /don_da_giao_hom_nay/);
  assert.match(svc, /don_da_giao_theo_ky/);
  assert.match(svc, /nguon: thanh_toan_duoc_ghi_nhan \? "CHOT_KHI_GIAO"/);
  assert.match(svc, /async doi_soat_doanh_thu_don_da_giao/);
  assert.match(svc, /ADMIN_DOI_SOAT_DOANH_THU_DON_DA_GIAO/);
});
