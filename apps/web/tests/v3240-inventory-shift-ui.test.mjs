import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.26.0 Web hien ke hoach nhap va canh bao overlap, giu dark picker", () => {
  const page = read("app/quan-tri/page.tsx");
  const lib = read("lib/quan-tri.ts");
  const css = read("app/globals.css");
  const ops = read("app/quan-tri/ops/page.tsx");

  assert.match(lib, /KeHoachNhapKhoAdmin/);
  assert.match(lib, /layGoiYNhapKhoAdmin/);
  assert.match(lib, /xuatGoiYNhapKhoExcelAdmin/);
  assert.match(lib, /layXungDotPhanCaAdmin/);
  assert.match(page, /Kế hoạch nhập đề xuất/);
  assert.match(page, /supplier.*phiếu nhập gần nhất|Theo phiếu nhập gần nhất/i);
  assert.match(page, /phanCaXungDot/);
  assert.match(page, /is-conflict-v324/);
  assert.match(page, /Backend v3\.24 chặn mọi phân ca chồng giờ/);
  assert.match(css, /cine-replenishment-v324/);
  assert.match(css, /cine-schedule-conflict-v324/);
  assert.match(css, /:root\{\s*color-scheme:dark;/);
  assert.match(ops, /OPS v3\.29\.0/);
});

test("v3.26.0 bang kho co viewport cuon rieng de khong cat cac cot ben phai", () => {
  const css = read("app/globals.css");
  assert.match(css, /\.cine-inventory-scroll-v214\{[^}]*max-height:min\(68vh,760px\)[^}]*overflow:auto/s);
  assert.match(css, /scrollbar-gutter:stable both-edges/);
  assert.match(css, /\.cine-inventory-scroll-v214>\.cine-inventory-head-v214\{[^}]*position:sticky[^}]*top:0/s);
  assert.match(css, /min-width:1880px/);
});
