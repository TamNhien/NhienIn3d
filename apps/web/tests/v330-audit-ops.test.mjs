import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.3.0 Web audit loc theo nguoi thao tac", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /Người thao tác/u);
  assert.match(page, /nhat_ky_nguoi_dung_id/);
  assert.match(lib, /nguoi_dung_id/);
});

test("v3.3.0 Web thong ke van hanh 7 30 ngay va xuat Excel", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /cine-ops-stats-v330/);
  assert.match(page, /7 ngày gần nhất|\{ky\.so_ngay\} ngày gần nhất/u);
  assert.match(page, /Xuất Excel/u);
  assert.match(lib, /layThongKeVanHanhAdmin/);
  assert.match(lib, /xuatLichSuVanHanhExcelAdmin/);
});

test("v3.3.0 Web hien policy silence escalation", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /Im lặng/);
  assert.match(page, /escalation/);
  assert.match(lib, /im_lang_phut/);
  assert.match(lib, /leo_thang_phut/);
});
