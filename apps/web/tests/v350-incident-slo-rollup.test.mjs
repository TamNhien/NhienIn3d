import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.5.0 Web co cau hinh muc tieu SLO", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /Mục tiêu SLO vận hành/u);
  assert.match(page, /SLA mục tiêu/u);
  assert.match(page, /Uptime mục tiêu/u);
  assert.match(page, /Xu hướng 7 \/ 30 ngày/u);
  assert.match(lib, /capNhatCauHinhSloVanHanhAdmin/);
});

test("v3.5.0 Web co incident acknowledge resolve note", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /Tiếp nhận incident/u);
  assert.match(page, /Đánh dấu đã khắc phục/u);
  assert.match(page, /Ghi chú xử lý \/ khắc phục/u);
  assert.match(lib, /tiepNhanSuCoVanHanhAdmin/);
  assert.match(lib, /khacPhucSuCoVanHanhAdmin/);
});
