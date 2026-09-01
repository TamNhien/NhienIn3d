import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.4.0 Web co UI cau hinh canh bao runtime", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /cine-system-config-v340/);
  assert.match(page, /Lưu & áp dụng/u);
  assert.match(page, /Nguồn:/u);
  assert.match(lib, /capNhatCauHinhCanhBaoHeThongAdmin/);
});

test("v3.4.0 Web co SLA incident timeline", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /cine-sla-v340/);
  assert.match(page, /SLA \/ Uptime/u);
  assert.match(page, /cine-incidents-v340/);
  assert.match(page, /Chuỗi sự cố theo chữ ký/u);
  assert.match(lib, /laySlaVanHanhAdmin/);
  assert.match(lib, /layChiTietSuCoVanHanhAdmin/);
});

test("v3.4.0 Web dung cursor load more audit va operations", () => {
  const page = doc("app/quan-tri/page.tsx");
  const lib = doc("lib/quan-tri.ts");
  assert.match(page, /Tải thêm sự kiện/u);
  assert.match(page, /Tải thêm lịch sử/u);
  assert.match(lib, /layNhatKyCursorAdmin/);
  assert.match(lib, /layLichSuVanHanhCursorAdmin/);
});
