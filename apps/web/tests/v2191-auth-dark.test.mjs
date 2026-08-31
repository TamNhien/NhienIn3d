import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("v2.19.1 auth input dark va Brave Chromium autofill khong con nen sang", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const login = readFileSync("app/dang-nhap/page.tsx", "utf8");
  assert.match(login, /className="cine-auth-form"/);
  assert.match(css, /v2\.19\.1 - auth dark fields/);
  assert.match(css, /background:#091321!important/);
  assert.match(css, /input:-webkit-autofill/);
  assert.match(css, /-webkit-text-fill-color:#f8fafc!important/);
  assert.match(css, /-webkit-box-shadow:0 0 0 1000px #091321 inset!important/);
  assert.match(css, /color-scheme:dark/);
});
