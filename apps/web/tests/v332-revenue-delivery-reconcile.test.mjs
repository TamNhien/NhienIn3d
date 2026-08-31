import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.3.2 Web chon dung giao dich cho ghi nhan va optimistic theo id", () => {
  const page = doc("app/quan-tri/page.tsx");
  assert.match(page, /const thanhToanChoGhiNhan/);
  assert.match(page, /ma_phuong_thuc === "COD"/);
  assert.match(page, /tt\.id === thanh_toan_can_chot_tam\?\.id/);
  assert.match(page, /const thanhToanHienThi/);
});

test("v3.3.2 Web phan biet da giao va doanh thu da co tu truoc", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(lib, /don_da_giao_theo_ky/);
  assert.match(page, /donChonDaThuTienTruoc/);
  assert.match(page, /Xác nhận đã giao"/);
  assert.match(page, /Đơn này đã thu tiền trước/);
  assert.match(page, /Đối soát giao hàng & doanh thu/);
  assert.match(page, /doiSoatDoanhThuDaGiao/);
  assert.match(page, /Đối soát doanh thu/);
  assert.match(lib, /doiSoatDoanhThuDonDaGiaoAdmin/);
});
