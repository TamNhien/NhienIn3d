import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("v3.2.3 fix typecheck optimistic payment array", () => {
  const client = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
  const page = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  assert.match(client, /AdminDonHangChiTiet = Omit<AdminDonHang, "thanh_toan">/);
  assert.match(client, /thanh_toan: AdminThanhToanChiTiet\[\]/);
  assert.match(page, /const chot_thanh_toan_tam/);
  assert.match(page, /thanh_toan: chot_thanh_toan_tam/);
});
