import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const doc = p => readFileSync(p, "utf8");

test("v3.1.0 API dang nhap truc tiep tao cookie va khong con MFA challenge", () => {
  const ctl = doc("src/xac-thuc/xac-thuc.controller.ts");
  const svc = doc("src/xac-thuc/xac-thuc.service.ts");
  assert.match(ctl, /this\.ghiCookie\(reply, kq\)/);
  assert.match(ctl, /return \{ nguoi_dung: kq\.nguoi_dung \}/);
  assert.doesNotMatch(ctl, /dang-nhap\/mfa|mfa\/khoi-tao|mfa\/xac-nhan|mfa\/tat/);
  assert.doesNotMatch(svc, /can_mfa|MFA_DANG_NHAP|mfa_totp_/);
  assert.equal(existsSync("src/xac-thuc/mfa-totp.ts"), false);
});

test("v3.0.0 cookie bao mat khi WEB_PUBLIC_URL la HTTPS van duoc giu", () => {
  const ctl = doc("src/xac-thuc/xac-thuc.controller.ts");
  assert.match(ctl, /WEB_PUBLIC_URL/);
  assert.match(ctl, /startsWith\("https:\/\/"\)/);
  assert.match(ctl, /secure: bao_mat/);
});

test("v3.1.0 API health quan tri doc DB size migration backup va SMTP khong lo secret", () => {
  const ctl = doc("src/quan-tri/quan-tri.controller.ts");
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  const mail = doc("src/thu-dien-tu/thu-dien-tu.service.ts");
  assert.match(ctl, /he-thong\/suc-khoe/);
  assert.match(svc, /suc_khoe_he_thong/);
  assert.match(svc, /pg_database_size/);
  assert.match(svc, /BACKUP_DIRECTORY/);
  assert.match(mail, /trangThaiCauHinh/);
  assert.doesNotMatch(mail, /password.*return/i);
});
