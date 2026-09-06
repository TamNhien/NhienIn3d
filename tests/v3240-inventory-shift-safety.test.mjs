import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.24.0 nang cap ke hoach nhap kho va chan phan ca chong gio", () => {
  const pkg = JSON.parse(read("package.json"));
  const apiPkg = JSON.parse(read("apps/api/package.json"));
  const webPkg = JSON.parse(read("apps/web/package.json"));
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const page = read("apps/web/app/quan-tri/page.tsx");
  const css = read("apps/web/app/globals.css");
  const readme = read("README.md");

  assert.equal(read("VERSION").trim(), "3.24.0");
  assert.equal(pkg.version, "3.24.0");
  assert.equal(apiPkg.version, "3.24.0");
  assert.equal(webPkg.version, "3.24.0");
  assert.equal(pkg.scripts.verify, "npm run verify:v324");
  assert.equal(pkg.scripts["verify:full"], "npm run verify:full:v324");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3240.mjs");

  assert.match(controller, /phan-ca\/xung-dot/);
  assert.match(controller, /kho\/goi-y-nhap/);
  assert.match(controller, /kho\/goi-y-nhap\/excel/);
  assert.match(controller, /trang_thai_ops_v3240/);

  assert.match(service, /ca_chong_gio_v3240/);
  assert.match(service, /tim_xung_dot_phan_ca_v3240/);
  assert.match(service, /danh_sach_xung_dot_phan_ca_v3240/);
  assert.match(service, /Hãy xử lý phân ca xung đột trước khi sửa mẫu ca/);
  assert.match(service, /goi_y_nhap_kho_v3240/);
  assert.match(service, /xuat_goi_y_nhap_kho_excel_v3240/);
  assert.match(service, /supplier_inference: "LATEST_RECEIPT"/);
  assert.match(service, /write_operation: false/);

  assert.match(page, /Kế hoạch nhập đề xuất/);
  assert.match(page, /Xuất kế hoạch Excel/);
  assert.match(page, /Backend v3\.24 chặn mọi phân ca chồng giờ/);
  assert.match(page, /Chồng giờ/);
  assert.match(css, /cine-replenishment-v324/);
  assert.match(css, /is-conflict-v324/);

  assert.match(readme, /## v3\.24\.0/);
  assert.match(readme, /kế hoạch nhập kho đề xuất/i);
  assert.match(readme, /chồng giờ/i);
  assert.equal(readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter((x) => x.isDirectory()).length, 23);
  assert.equal(existsSync("scripts/verify-v3230.ps1"), true);
  assert.equal(existsSync("scripts/verify-v3240.ps1"), true);
});
