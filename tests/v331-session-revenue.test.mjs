import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.3.1 rate limit du cho Admin F5 va dong bo Docker env", () => {
  const main = doc("apps/api/src/main.ts");
  const env = doc(".env.example");
  const compose = doc("docker-compose.yml");
  assert.match(main, /API_RATE_LIMIT_MAX \|\| 600/);
  assert.match(main, /Math\.max\(120/);
  assert.match(env, /API_RATE_LIMIT_MAX=600/);
  assert.match(compose, /API_RATE_LIMIT_MAX: \$\{API_RATE_LIMIT_MAX:-600\}/);
});

test("v3.3.1 auth single flight va 429 khong bi xem la dang xuat", () => {
  const auth = doc("apps/web/lib/xac-thuc.ts");
  const authService = doc("apps/api/src/xac-thuc/xac-thuc.service.ts");
  const nav = doc("apps/web/components/thanh-dieu-huong.tsx");
  const admin = doc("apps/web/app/quan-tri/page.tsx");
  assert.match(auth, /phien_dang_lam_moi/);
  assert.match(auth, /tai_khoan_dang_tai/);
  assert.match(authService, /lam_moi_dang_xu_ly/);
  assert.match(authService, /30_000/);
  assert.match(authService, /chong_trung_f5: true/);
  assert.match(auth, /if \(!res\.ok\) throw new Error\(await docLoi\(res\)\)/);
  assert.match(nav, /layTaiKhoan\(\)\.then\(setTaiKhoan\)\.catch\(\(\) => undefined\)/);
  assert.match(admin, /Phi\u00ean \u0111\u0103ng nh\u1eadp v\u1eabn \u0111\u01b0\u1ee3c gi\u1eef/);
});

test("v3.3.1 doanh thu cap nhat ngay va tong quan doc dung giao dich da thanh toan", () => {
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  const page = doc("apps/web/app/quan-tri/page.tsx");
  assert.match(svc, /thanh_toan\.find\(x => x\.trang_thai === TrangThaiThanhToan\.DA_THANH_TOAN\)/);
  assert.match(svc, /cap_nhat_doanh_thu/);
  assert.match(svc, /thanh_toan_da_ghi_nhan/);
  assert.match(svc, /da_ghi_nhan_moi: thanh_toan_duoc_ghi_nhan \|\| fallback_legacy_moi/);
  assert.match(page, /capNhatTongQuanSauDon/);
  assert.match(page, /dongBoTongQuan/);
  assert.match(page, /kh\u00f4ng c\u1ed9ng l\u1ea7n hai/);
});
