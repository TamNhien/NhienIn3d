import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.26.0 Web hien refund SLA, supplier groups va preview/apply cycle count", () => {
  const api = read("lib/quan-tri.ts");
  const page = read("app/quan-tri/page.tsx");
  const css = read("app/globals.css");
  assert.match(api, /xuatHoanTienCanXuLyExcelAdmin/);
  assert.match(api, /kiemTraKiemKeKhoAdmin/);
  assert.match(api, /apDungKiemKeKhoAdmin/);
  assert.match(page, /Excel hoàn tiền/);
  assert.match(page, /Hoàn tiền cần xử lý/);
  assert.match(page, /Gom đề xuất theo nhà cung cấp/);
  assert.match(page, /Kiểm kê tồn thực tế/);
  assert.match(page, /Xem trước/);
  assert.match(page, /Áp dụng kiểm kê/);
  assert.match(css, /cine-refund-sla-v326/);
  assert.match(css, /cine-supplier-plan-v326/);
  assert.match(css, /cine-cycle-count-v326/);
});
