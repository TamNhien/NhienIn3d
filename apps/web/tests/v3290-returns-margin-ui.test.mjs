import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.29.0 Web co RMA partial refund va dashboard gross margin", () => {
  const api = read("lib/quan-tri.ts");
  const page = read("app/quan-tri/page.tsx");
  const css = read("app/globals.css");
  const browser = read("../../scripts/e2e-browser-v3290.mjs");
  assert.match(api, /YeuCauDoiTraAdmin/);
  assert.match(api, /layDoiTraAdmin/);
  assert.match(api, /taoDoiTraAdmin/);
  assert.match(api, /xacNhanHoanTienMotPhanAdmin/);
  assert.match(api, /xuatDoiTraExcelAdmin/);
  assert.match(api, /xuatLoiNhuanExcelAdmin/);
  assert.match(page, /Đổi \/ trả hàng \(RMA\)/);
  assert.match(page, /Excel đổi\/trả/);
  assert.match(page, /Lợi nhuận gộp 30 ngày/);
  assert.match(page, /Excel lợi nhuận/);
  assert.match(page, /không tự gọi cổng thanh toán|không gọi gateway|tiền thật bên ngoài hệ thống/i);
  assert.match(css, /cine-margin-strip-v329/);
  assert.match(css, /cine-rma-panel-v329/);
  assert.match(browser, /RMA\/partial refund v3\.29\.0/);
  assert.match(browser, /\.cine-order-admin-item-v212/);
  assert.match(browser, /Lợi nhuận gộp 30 ngày/);
});
