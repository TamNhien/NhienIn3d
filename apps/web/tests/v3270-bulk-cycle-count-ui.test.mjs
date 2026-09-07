import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.27.0 Web co kiem ke hang loat CSV Excel va xuat doi soat", () => {
  const api = read("lib/quan-tri.ts");
  const page = read("app/quan-tri/page.tsx");
  const css = read("app/globals.css");
  assert.match(api, /KiemKeTepKhoAdmin/);
  assert.match(api, /kiemTraTepKiemKeKhoAdmin/);
  assert.match(api, /xuatKiemKeKhoExcelAdmin/);
  assert.match(page, /Tải CSV mẫu/);
  assert.match(page, /Chọn CSV \/ Excel/);
  assert.match(page, /Áp dụng \$\{kiem_ke_tep\.tong_dong\} dòng/);
  assert.match(page, /Xuất Excel đối soát/);
  assert.match(page, /Boolean\(kiem_ke_tep && !kiem_ke_tep\.co_the_ap_dung\)/);
  assert.match(page, /Nếu một snapshot đã thay đổi, toàn bộ batch sẽ rollback/);
  assert.match(css, /cine-cycle-count-actions-v327/);
  assert.match(css, /cine-cycle-count-file-summary-v327/);
  assert.match(css, /cine-cycle-count-file-table-v327/);
  const browser = read("../../scripts/e2e-browser-v3270.mjs");
  assert.match(browser, /≤ 200 dòng · audit đầy đủ/);
  assert.match(browser, /page\.locator\("\.cine-cycle-count-v326"\)/);
  assert.match(browser, /cycleCountCard\.getByRole\("button", \{ name: "Tải CSV mẫu", exact: true \}\)/);
  assert.doesNotMatch(browser, /page\.getByRole\("button", \{ name: "Tải CSV mẫu", exact: true \}\)\.waitFor\(\)/);
});
