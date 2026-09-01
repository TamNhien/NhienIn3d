import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.7.0 Web co Ops Dashboard rieng", () => {
  assert.equal(existsSync("app/quan-tri/ops/page.tsx"), true);
  const page = read("app/quan-tri/ops/page.tsx");
  assert.match(page, /Ops Dashboard/);
  assert.match(page, /Multi-window burn-rate policy/);
  assert.match(page, /Error budget theo dịch vụ/);
  assert.match(page, /Webhook delivery log/);
  assert.match(page, /Maintenance windows/);
});

test("v3.7.0 Web co CRUD maintenance va SLO nang cao", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  const lib = read("lib/quan-tri.ts");
  assert.match(lib, /layDanhSachBaoTriAdmin/);
  assert.match(lib, /taoBaoTriAdmin/);
  assert.match(lib, /capNhatBaoTriNangCaoAdmin/);
  assert.match(lib, /xoaBaoTriAdmin/);
  assert.match(lib, /layCauHinhSloNangCaoAdmin/);
  assert.match(lib, /capNhatCauHinhSloNangCaoAdmin/);
  assert.match(page, /Thêm window/);
  assert.match(page, /Lưu SLO policy/);
});

test("v3.7.0 Web filter incident va export Ops Excel", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  const lib = read("lib/quan-tri.ts");
  assert.match(page, /Trạng thái incident/);
  assert.match(page, /Từ ngày/);
  assert.match(page, /Đến ngày/);
  assert.match(lib, /xuatOpsTongHopExcelAdmin/);
  assert.match(lib, /layWebhookDeliveryAdmin/);
});
