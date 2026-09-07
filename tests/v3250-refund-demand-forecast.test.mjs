import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
const read = (p) => readFileSync(p, "utf8");

test("v3.26.0 them doi soat hoan tien va du bao nhap kho theo nhu cau", () => {
  const pkg = JSON.parse(read("package.json"));
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const page = read("apps/web/app/quan-tri/page.tsx");
  const lib = read("apps/web/lib/quan-tri.ts");
  const css = read("apps/web/app/globals.css");
  const compose = read("docker-compose.yml");
  const envExample = read(".env.example");
  assert.equal(read("VERSION").trim(), "3.28.0");
  assert.equal(pkg.version, "3.28.0");
  assert.equal(pkg.scripts.verify, "npm run verify:v328");
  assert.equal(pkg.scripts["verify:full"], "npm run verify:full:v328");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3280.mjs");
  assert.equal(existsSync("scripts/verify-v3260.ps1"), true);
  assert.ok(readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter(x => x.isDirectory()).length >= 23);

  assert.match(controller, /don-hang\/hoan-tien-can-xu-ly/);
  assert.match(controller, /don-hang\/:id\/xac-nhan-hoan-tien/);
  assert.match(controller, /trang_thai_ops_v3280/);
  assert.match(service, /TrangThaiThanhToan\.DA_HOAN_TIEN/);
  assert.match(service, /gateway_auto_refund: false/);
  assert.match(service, /manual_confirmation_required: true/);
  assert.match(service, /ADMIN_XAC_NHAN_HOAN_TIEN/);
  assert.match(service, /SYSTEM_INVENTORY_FORECAST_DAYS/);
  assert.match(envExample, /SYSTEM_INVENTORY_FORECAST_DAYS=14/);
  assert.match(compose, /SYSTEM_INVENTORY_FORECAST_DAYS: \${SYSTEM_INVENTORY_FORECAST_DAYS:-14}/);
  assert.match(service, /forecast_basis: "NON_CANCELLED_ORDER_LINES_30D"/);
  assert.match(service, /cart_demand_is_reservation: false/);
  assert.match(service, /active_cart_demand/);
  assert.match(service, /de_xuat_theo_du_bao/);

  assert.match(lib, /HoanTienCanXuLyAdmin/);
  assert.match(lib, /xacNhanHoanTienDonHangAdmin/);
  assert.match(page, /Hoàn tiền cần xử lý/);
  assert.match(page, /không tự gọi cổng thanh toán/);
  assert.match(page, /tốc độ bán 30 ngày/);
  assert.match(page, /Giỏ đang mở:/);
  assert.match(css, /cine-refund-queue-panel-v325/);
  assert.match(css, /cine-demand-risk-v325/);
});
