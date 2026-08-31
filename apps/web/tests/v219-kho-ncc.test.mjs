import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lib = readFileSync("lib/quan-tri.ts", "utf8");
const page = readFileSync("app/quan-tri/page.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

test("v2.19.0 Web co tab nha cung cap va CRUD client", () => {
  assert.match(lib, /NhaCungCapAdmin/);
  assert.match(lib, /taoNhaCungCapAdmin/);
  assert.match(lib, /capNhatNhaCungCapAdmin/);
  assert.match(lib, /xoaNhaCungCapAdmin/);
  assert.match(page, /\["nha-cung-cap", "Nhà cung cấp"\]/u);
  assert.match(page, /Thêm nhà cung cấp/u);
});

test("v2.19.0 Web kho chon nha cung cap va quan ly phieu nhap", () => {
  assert.match(page, /nhap_lo_meta\.nha_cung_cap_id/);
  assert.match(page, /Lịch sử phiếu nhập kho/u);
  assert.match(page, /xemChiTietPhieuNhapKho/);
  assert.match(page, /taiExcelPhieuNhapKho/);
  assert.match(css, /cine-receipt-history-v219/);
});

test("v2.19.0 Web ton min max va goi y nhap responsive", () => {
  assert.match(page, /Tồn min/u);
  assert.match(page, /Tồn max/u);
  assert.match(page, /cine-reorder-suggest-v219/);
  assert.match(page, /CAN_NHAP/);
  assert.match(css, /min-width:2050px/);
  assert.match(css, /cine-inventory-stat-v214\.reorder/);
});
