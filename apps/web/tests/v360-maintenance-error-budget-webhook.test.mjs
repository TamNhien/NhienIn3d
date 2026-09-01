import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.6.0 Web co maintenance window UI", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /Maintenance window/);
  assert.match(page, /Lưu maintenance window/);
  assert.match(lib, /layBaoTriHeThongAdmin/);
  assert.match(lib, /capNhatBaoTriHeThongAdmin/);
});

test("v3.6.0 Web hien error budget burn-rate", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /Error budget SLA · 30 ngày/);
  assert.match(page, /Burn-rate SLA · 1h \/ 6h \/ 24h/);
  assert.match(lib, /ErrorBudgetAdmin/);
  assert.match(lib, /BurnRateWindowAdmin/);
});

test("v3.6.0 Web export Incident Timeline Excel", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /Xuất Incident Excel/);
  assert.match(page, /Xuất Timeline Excel/);
  assert.match(lib, /xuatDanhSachSuCoExcelAdmin/);
  assert.match(lib, /xuatChiTietSuCoExcelAdmin/);
});
