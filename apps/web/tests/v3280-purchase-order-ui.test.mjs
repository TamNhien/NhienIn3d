import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.28.0 Web co PO, lead time, lien ket phieu nhap va phien kiem ke", () => {
  const api = read("lib/quan-tri.ts");
  const page = read("app/quan-tri/page.tsx");
  const css = read("app/globals.css");
  const browser = read("../../scripts/e2e-browser-v3280.mjs");
  assert.match(api, /DonMuaHangAdmin/);
  assert.match(api, /PhienKiemKeKhoAdmin/);
  assert.match(api, /layDonMuaHangAdmin/);
  assert.match(api, /taoDonMuaHangAdmin/);
  assert.match(api, /TaoNhaCungCapAdminPayload = Pick<NhaCungCapAdmin/);
  assert.doesNotMatch(api, /taoNhaCungCapAdmin = \(payload: Omit<NhaCungCapAdmin/);
  assert.match(api, /duyetApDungPhienKiemKeKhoAdmin/);
  assert.match(page, /Đơn mua hàng · Purchase Order/);
  assert.match(page, /Tạo PO nháp/);
  assert.match(page, /Lead time \(ngày\)/);
  assert.match(page, /PO liên kết/);
  assert.match(page, /Cho phép nhập vượt PO \(override audit\)/);
  assert.match(page, /Lưu thành phiên kiểm kê/);
  assert.match(page, /Phiên kiểm kê/);
  assert.match(css, /cine-purchase-orders-v328/);
  assert.match(css, /cine-count-sessions-v328/);
  assert.match(browser, /Đơn mua hàng · Purchase Order/);
  assert.match(browser, /Lưu thành phiên kiểm kê/);
});
