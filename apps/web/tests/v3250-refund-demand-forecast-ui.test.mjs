import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(p, "utf8");

test("v3.26.0 Web hien queue hoan tien va demand-aware replenishment", () => {
  const page = read("app/quan-tri/page.tsx");
  const lib = read("lib/quan-tri.ts");
  const css = read("app/globals.css");
  const ops = read("app/quan-tri/ops/page.tsx");
  assert.match(lib, /HoanTienCanXuLyAdmin/);
  assert.match(lib, /layHoanTienCanXuLyAdmin/);
  assert.match(lib, /xacNhanHoanTienDonHangAdmin/);
  assert.match(page, /Hoàn tiền cần xử lý/);
  assert.match(page, /Xác nhận đã hoàn tiền/);
  assert.match(page, /không tự gọi cổng thanh toán/);
  assert.match(page, /tốc độ bán 30 ngày/);
  assert.match(page, /Dự báo:/);
  assert.match(page, /Giỏ đang mở:/);
  assert.match(page, /không giữ chỗ/);
  assert.match(css, /cine-refund-queue-panel-v325/);
  assert.match(css, /cine-demand-risk-v325/);
  assert.match(ops, /OPS v3\.26\.0/);
});
