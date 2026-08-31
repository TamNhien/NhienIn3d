import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.3.1 API rate limit co the cau hinh va mac dinh 600", () => {
  const main = doc("src/main.ts");
  const auth = doc("src/xac-thuc/xac-thuc.service.ts");
  assert.match(main, /API_RATE_LIMIT_MAX \|\| 600/);
  assert.match(main, /register\(rateLimit, \{ max: api_rate_limit_max/);
  assert.match(auth, /lam_moi_dang_xu_ly/);
  assert.match(auth, /30_000/);
  assert.match(auth, /chong_trung_f5: true/);
});

test("v3.3.1 API tra metadata doanh thu va tong quan chon giao dich da thanh toan", () => {
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /cap_nhat_doanh_thu/);
  assert.match(svc, /da_co_tu_truoc/);
  assert.match(svc, /thanh_toan_da_ghi_nhan/);
  assert.match(svc, /const thanh_toan_can_chot/);
  assert.match(svc, /!thanh_toan_da_ghi_nhan/);
  assert.match(svc, /thanh_toan\.find\(x => x\.trang_thai === TrangThaiThanhToan\.DA_THANH_TOAN\)/);
  assert.match(svc, /filter\(x => x\.ngay_ghi_nhan >= bat_dau_30_ngay\)/);
});
