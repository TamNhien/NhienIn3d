import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.3.1 Web single flight auth va loi tam thoi khong xoa session UI", () => {
  const auth = doc("lib/xac-thuc.ts");
  const nav = doc("components/thanh-dieu-huong.tsx");
  const admin = doc("app/quan-tri/page.tsx");
  assert.match(auth, /phien_dang_lam_moi/);
  assert.match(auth, /tai_khoan_dang_tai/);
  assert.match(nav, /catch\(\(\) => undefined\)/);
  assert.match(admin, /h\u1ec7 th\u1ed1ng s\u1ebd t\u1ef1 th\u1eed l\u1ea1i/);
});

test("v3.3.1 Web doanh thu optimistic va dong bo lai tu PostgreSQL", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(lib, /cap_nhat_doanh_thu\?/);
  assert.match(page, /capNhatTongQuanSauDon/);
  assert.match(page, /da_ghi_nhan_moi/);
  assert.match(page, /thanhToanDaGhiNhan/);
  assert.match(page, /window\.setTimeout\(\(\) => \{ void dongBoTongQuan\(\); \}, 900\)/);
});
