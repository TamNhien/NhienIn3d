import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("v3.2.2 cap nhat don optimistic va refresh nen khong chan nut", () => {
  const src = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const a = src.indexOf("async function luuTrangThaiDon()");
  const b = src.indexOf("function suaSanPhamLocal", a);
  const fn = src.slice(a, b);
  assert.match(fn, /optimistic UI/);
  assert.match(fn, /setDonHang\(ds => ds\.map/);
  assert.match(fn, /Promise\.allSettled/);
  assert.doesNotMatch(fn, /await Promise\.all\(\[layDonHangAdmin/);
});
