import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const doc = p => readFileSync(p, "utf8");

test("v3.0.0 API TOTP dung HMAC-SHA1 30 giay va cua so lech 1 buoc", () => {
  const mfa = doc("src/xac-thuc/mfa-totp.ts");
  assert.match(mfa, /createHmac\("sha1"/);
  assert.match(mfa, /const BUOC_GIAY = 30/);
  assert.match(mfa, /for \(let lech = -1; lech <= 1; lech\+\+\)/);
});

test("v3.0.0 cookie bao mat khi WEB_PUBLIC_URL la HTTPS", () => {
  const ctl = doc("src/xac-thuc/xac-thuc.controller.ts");
  assert.match(ctl, /WEB_PUBLIC_URL/);
  assert.match(ctl, /startsWith\("https:\/\/"\)/);
  assert.match(ctl, /secure: bao_mat/);
});

test("v3.0.1 dang nhap MFA narrow union truoc khi ghi cookie", () => {
  const controller = readFileSync("src/xac-thuc/xac-thuc.controller.ts", "utf8");
  assert.match(controller, /if \("can_mfa" in kq\) return \{ can_mfa: true,/);
  assert.doesNotMatch(controller, /"can_mfa" in kq && kq\.can_mfa/);
});
