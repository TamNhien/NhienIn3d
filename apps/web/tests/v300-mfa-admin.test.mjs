import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const doc = p => readFileSync(p, "utf8");

test("v3.1.0 Web login bo MFA va dang nhap mot buoc", () => {
  const page = doc("app/dang-nhap/page.tsx");
  const auth = doc("lib/xac-thuc.ts");
  assert.match(page, /<h1>Đăng nhập<\/h1>/);
  assert.doesNotMatch(page, /Xác minh Admin|one-time-code|Authenticator/);
  assert.doesNotMatch(auth, /xacNhanDangNhapMfa|TrangThaiMfa|KhoiTaoMfa|can_mfa/);
});

test("v3.1.0 Admin co tab He thong va dashboard suc khoe", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /\["he-thong", "Hệ thống"\]/);
  assert.match(page, /Sức khỏe hệ thống/);
  assert.match(page, /Backup tự động trên Windows/);
  assert.match(page, /backup-schedule\.ps1/);
  assert.match(lib, /AdminSucKhoeHeThong/);
  assert.match(lib, /laySucKhoeHeThongAdmin/);
  assert.doesNotMatch(page, /Khởi tạo MFA|Tắt MFA|Setup key/);
});

test("v3.0.0 Web audit co loc va xuat CSV van duoc giu", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /Lọc nhật ký/);
  assert.match(page, /Xuất CSV/);
  assert.match(lib, /xuatNhatKyCsvAdmin/);
});
