import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.3.2 chot giao dich cho thanh toan dung du giao dich moi nhat that bai", () => {
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /const thanh_toan_can_chot = hien_tai\.thanh_toan\.find\(tt =>[\s\S]*CHO_THANH_TOAN[\s\S]*ma_phuong_thuc === "COD"/);
  assert.match(svc, /\|\| hien_tai\.thanh_toan\.find\(tt => tt\.trang_thai === TrangThaiThanhToan\.CHO_THANH_TOAN\)/);
  assert.match(svc, /where: \{ id: thanh_toan_can_chot\.id \}/);
  assert.match(svc, /giao_dich_da_ghi_nhan_sau/);
});

test("v3.3.2 tach don da giao voi don vua ghi nhan doanh thu de khong hieu nham", () => {
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  const web = doc("apps/web/app/quan-tri/page.tsx");
  const lib = doc("apps/web/lib/quan-tri.ts");
  assert.match(svc, /don_da_giao_theo_ky/);
  assert.match(lib, /don_da_giao_theo_ky/);
  assert.match(web, /Đối soát giao hàng & doanh thu/);
  assert.match(web, /đơn đã giao/);
  assert.match(web, /không cộng doanh thu lần hai/);
  const controller = doc("apps/api/src/quan-tri/quan-tri.controller.ts");
  assert.match(controller, /don-hang\/doi-soat-doanh-thu/);
  assert.match(web, /Đối soát doanh thu/);
});
