import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.2.0 Web checkbox Dang hoat dong nha cung cap gon", () => {
  const page = doc("app/quan-tri/page.tsx");
  const css = doc("app/globals.css");
  assert.match(page, /cine-supplier-active-check-v320/);
  assert.match(css, /cine-supplier-active-check-v320 input\{[^}]*width:15px/i);
  assert.match(css, /white-space:nowrap/);
});

test("v3.2.0 Web audit co phan trang diff va xuat Excel", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /cine-audit-diff-v320/);
  assert.match(page, /Xuất Excel/u);
  assert.match(page, /Trang <b>\{nhat_ky_phan_trang\.trang\}|cine-cursor-pagination-v340/);
  assert.match(lib, /layNhatKyPhanTrangAdmin/);
  assert.match(lib, /xuatNhatKyExcelAdmin/);
});

test("v3.2.0 Web he thong co alert va lich su van hanh", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /Cảnh báo vận hành/u);
  assert.match(page, /Lịch sử vận hành/u);
  assert.match(page, /Kiểm tra & gửi ngay/u);
  assert.match(lib, /layLichSuVanHanhAdmin/);
  assert.match(lib, /guiCanhBaoHeThongAdmin/);
});
