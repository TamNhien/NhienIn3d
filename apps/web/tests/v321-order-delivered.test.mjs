import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.2.1 Web cho chon Da giao tu moi trang thai don", () => {
  const page = doc("app/quan-tri/page.tsx");
  assert.match(page, /CHO_XAC_NHAN: \["DA_XAC_NHAN", "DA_HUY", "HOAN_TAT"\]/);
  assert.match(page, /DA_XAC_NHAN: \["DANG_SAN_XUAT", "DA_HUY", "HOAN_TAT"\]/);
  assert.match(page, /DANG_SAN_XUAT: \["DANG_GIAO", "DA_HUY", "HOAN_TAT"\]/);
  assert.match(page, /DA_HUY: \["HOAN_TAT"\]/);
  assert.match(page, /cine-order-admin-override-v321/);
});
