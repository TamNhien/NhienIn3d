import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
const webLib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");

// E2E contract: kiểm tra cùng một luồng từ route API -> client API -> UI Admin.
test("v2.18.0 E2E contract preview file CSV XLSX truoc khi ghi", () => {
  assert.match(controller, /@Post\("kho\/import\/kiem-tra"\)/);
  assert.match(service, /kiem_tra_tep_nhap_kho/);
  assert.match(service, /\["csv", "xlsx"\]/);
  assert.match(service, /tối đa 500 dòng dữ liệu/u);
  assert.match(webLib, /kiemTraTepNhapKhoAdmin/);
  assert.match(admin, /Chọn CSV \/ Excel/u);
  assert.match(admin, /kiểm tra toàn bộ mã biến thể và số lượng trước khi ghi/u);
});

test("v2.18.0 E2E contract xac nhan nhap lo tao phieu va refresh kho", () => {
  assert.match(controller, /@Post\("kho\/nhap-lo"\)/);
  assert.match(service, /this\.db\.\$transaction/);
  assert.match(service, /tx\.phieuNhapKho\.create/);
  assert.match(service, /tx\.chiTietPhieuNhapKho\.create/);
  assert.match(service, /ADMIN_NHAP_KHO_THEO_LO/);
  assert.match(webLib, /nhapKhoTheoLoAdmin/);
  assert.match(webLib, /layPhieuNhapKhoAdmin/);
  assert.match(admin, /Xác nhận nhập kho/u);
  assert.match(admin, /Phiếu nhập gần đây/u);
});

test("v2.18.0 E2E contract canh bao email co route client UI va chong gui lap", () => {
  assert.match(controller, /@Get\("kho\/canh-bao-email"\)/);
  assert.match(controller, /@Post\("kho\/canh-bao-email\/gui"\)/);
  assert.match(service, /CANH_BAO_KHO_EMAIL/);
  assert.match(service, /createHash\("sha256"\)/);
  assert.match(service, /đã chống gửi lặp/u);
  assert.match(webLib, /layTrangThaiCanhBaoKhoEmailAdmin/);
  assert.match(webLib, /guiCanhBaoKhoEmailAdmin/);
  assert.match(admin, /Cảnh báo tồn kho qua email/u);
  assert.match(admin, /Kiểm tra & gửi ngay/u);
});

test("v2.18.0 E2E contract giu CRUD tham chieu duyet danh gia va xuat bao cao", () => {
  for (const route of ["vat-lieu", "mau-sac", "danh-gia/:id/trang-thai", "bao-cao/:loai"]) {
    assert.match(controller, new RegExp(route.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")));
  }
  for (const fn of ["taoVatLieuAdmin", "taoMauSacAdmin", "capNhatDanhGiaAdmin", "layBaoCaoExcelAdmin"]) assert.match(webLib, new RegExp(fn));
  assert.match(admin, /Vật liệu & màu sắc/u);
  assert.match(admin, /Duyệt đánh giá sản phẩm/u);
  assert.match(admin, /Xuất Excel/u);
});
