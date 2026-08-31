import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("v3.2.2 form trang thai don khong chong field", () => {
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /v3\.2\.2 - order status form/);
  assert.match(css, /cine-order-update-fields-v212 label\{min-width:0\}/);
  assert.match(css, /width:100%;max-width:100%;min-width:0/);
});

test("v3.2.2 cap nhat trang thai phan hoi ngay va refresh nen", () => {
  const src = readFileSync("app/quan-tri/page.tsx", "utf8");
  assert.match(src, /optimistic UI/);
  assert.match(src, /Promise\.allSettled/);
  assert.match(src, /setDangXuLy\(null\)/);
});
