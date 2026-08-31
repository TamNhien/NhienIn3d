import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const doc = p => readFileSync(p, "utf8");

test("v3.0.0 Web login co buoc MFA Admin", () => {
  const page = doc("app/dang-nhap/page.tsx");
  const auth = doc("lib/xac-thuc.ts");
  assert.match(page, /Xác minh Admin/);
  assert.match(page, /one-time-code/);
  assert.match(auth, /xacNhanDangNhapMfa/);
});

test("v3.0.0 Admin co tab Bao mat va MFA setup disable", () => {
  const page = doc("app/quan-tri/page.tsx");
  assert.match(page, /\["bao-mat", "Bảo mật"\]/);
  assert.match(page, /Khởi tạo MFA/);
  assert.match(page, /Tắt MFA/);
  assert.match(page, /backup-db\.ps1/);
});

test("v3.0.0 Web audit co loc va xuat CSV", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /Lọc nhật ký/);
  assert.match(page, /Xuất CSV/);
  assert.match(lib, /xuatNhatKyCsvAdmin/);
});
