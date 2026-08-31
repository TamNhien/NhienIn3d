import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("v3.2.3 chi tiet don khong giao thanh_toan object voi thanh_toan array", () => {
  const client = readFileSync("lib/quan-tri.ts", "utf8");
  assert.match(client, /export type AdminThanhToanTomTat/);
  assert.match(client, /export type AdminThanhToanChiTiet/);
  assert.match(client, /AdminDonHangChiTiet = Omit<AdminDonHang, "thanh_toan">/);
  assert.match(client, /thanh_toan: AdminThanhToanChiTiet\[\]/);
  assert.doesNotMatch(client, /AdminDonHangChiTiet = AdminDonHang &/);
});
