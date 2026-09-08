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


test("v3.28.0 Nhap kho theo lo tach 2 hang ro rang va khong chong field", () => {
  const page = read("app/quan-tri/page.tsx");
  const css = read("app/globals.css");
  assert.match(page, /cine-batch-row-top-v328/);
  assert.match(page, /cine-batch-row-bottom-v328/);
  assert.match(page, /cine-batch-label-line-v328/);
  assert.match(page, /cine-batch-override-field-v328/);
  assert.match(page, /<span>Tùy chọn PO<\/span><div className="cine-check-v215 cine-batch-override-v328">/u);
  assert.match(css, /\.cine-batch-meta-v218\{[\s\S]*?display:block!important;/);
  assert.match(css, /\.cine-batch-row-top-v328\{[\s\S]*?grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.cine-batch-row-bottom-v328\{[\s\S]*?grid-template-columns:minmax\(0,2fr\) minmax\(0,1fr\)/);
  assert.match(css, /\.cine-batch-supplier-v328\{[\s\S]*?position:static!important;/);
  assert.match(css, /\.cine-batch-meta-v218 \.cine-batch-override-field-v328>\.cine-batch-override-v328\{[\s\S]*?grid-row:2!important;/);
  assert.match(css, /\.cine-batch-meta-v218 \.cine-batch-override-v328 input\[type="checkbox"\]\{[\s\S]*?width:18px!important;[\s\S]*?height:18px!important;/);
});

test("v3.28.0 Xem truoc kiem ke hien ket qua hoac loi ngay trong card", () => {
  const page = read("app/quan-tri/page.tsx");
  const css = read("app/globals.css");
  assert.match(page, /kiem_ke_preview_message/);
  assert.match(page, /setKiemKePreviewMessage\(`Đang đối chiếu/);
  assert.match(page, /onClick=\{\(\)=>void xemTruocKiemKeKho\(\)\}/);
  assert.match(page, /cine-cycle-count-status-v328/);
  assert.match(page, /role="status" aria-live="polite"/);
  assert.match(page, /Không thể xem trước/);
  assert.match(css, /\.cine-cycle-count-status-v328\{/);
  assert.match(css, /\.cine-cycle-count-status-v328\.ok/);
  assert.match(css, /\.cine-cycle-count-status-v328\.bad/);
});
