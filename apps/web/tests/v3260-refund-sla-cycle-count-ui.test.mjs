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

test("v3.26.0 canh thang field nhap kho va cycle count co padding noi bo", () => {
  const css = read("app/globals.css");
  assert.match(css, /\.cine-batch-meta-v218\{[\s\S]*?align-items:start;/);
  assert.match(css, /\.cine-batch-meta-v218 input,[\s\S]*?\.cine-batch-meta-v218 select\{[\s\S]*?height:54px;/);
  assert.match(css, /\.cine-cycle-count-v326\{[\s\S]*?padding:20px 22px 22px;/);
  assert.match(css, /\.cine-cycle-count-form-v326 input,[\s\S]*?\.cine-cycle-count-form-v326 select\{[\s\S]*?height:48px;/);
  assert.match(css, /\.cine-cycle-count-form-v326 \.cine-btn\{[\s\S]*?height:48px;/);
});
