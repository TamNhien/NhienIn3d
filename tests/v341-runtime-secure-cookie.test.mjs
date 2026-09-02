import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.4.1 runtime E2E khong mat Secure access cookie khi CI goi HTTP loopback", () => {
  const e2e = doc("scripts/e2e-runtime-v341.ps1");
  assert.match(e2e, /Invoke-WebRequest[\s\S]*xac-thuc\/dang-nhap/);
  assert.match(e2e, /Headers\["Set-Cookie"\]/);
  assert.match(e2e, /accessMatch = \[regex\]::Match\(\$setCookie/);
  assert.match(e2e, /\$adminHeaders = @\{ Cookie = "nhienin3d_phien=/);
  assert.match(e2e, /quan-tri\/don-hang" -Method Get -Headers \$adminHeaders/);
});

test("v3.4.1 CI dung runtime script da va Secure-cookie", () => {
  const ci = doc(".github/workflows/ci.yml");
  assert.match(ci, /run: \.\/scripts\/e2e-runtime-v(?:341|35[01234]|36[01234567]|37[012]|380|390|3100|3101|3102|3103|3104|3105|3110)\.ps1/);
});
