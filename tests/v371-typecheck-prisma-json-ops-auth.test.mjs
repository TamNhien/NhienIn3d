import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(name, "utf8");

test("v3.7.1 maintenance persistence dung Prisma InputJsonObject thay Record unknown", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  assert.match(service, /type BaoTriV370Luu = \{/);
  assert.match(service, /chuan_hoa_bao_tri_v370\(raw: unknown\): BaoTriV370Luu \| null/);
  assert.match(service, /luu_danh_sach_bao_tri_v370\(actor: NguoiDungXacThuc, windows: BaoTriV370Luu\[\]\)/);
  assert.match(service, /const gia_tri: Prisma\.InputJsonObject = \{ windows \};/);
  assert.doesNotMatch(service, /luu_danh_sach_bao_tri_v370\(actor: NguoiDungXacThuc, windows: Array<Record<string, unknown>>\)/);
});

test("v3.7.1 Ops Dashboard van kiem tra taiKhoan null truoc khi doc vai_tro", () => {
  const page = read("apps/web/app/quan-tri/ops/page.tsx");
  assert.match(page, /if \(!taiKhoan\) throw new Error/);
  assert.match(page, /if \(taiKhoan\.vai_tro === "ADMIN"\)/);
  assert.ok(page.indexOf("if (!taiKhoan)") < page.indexOf('if (taiKhoan.vai_tro === "ADMIN")'));
});

test("v3.7.1 typecheck fix duoc giu khi nang v3.11.0", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  const runtime = read("scripts/e2e-runtime-v3100.ps1");
  const browser = read("scripts/e2e-browser-v3100.mjs");
  const health = read("apps/api/src/suc-khoe/suc-khoe.controller.ts");
  assert.equal(pkg.version, "3.12.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3120.mjs");
  assert.match(ci, /e2e-runtime-v3120\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.12\.0/);
  assert.match(runtime, /publicHealth\.phien_ban -eq "v3\.10\.0"/);
  assert.match(runtime, /health\.phien_ban -eq "3\.10\.0"/);
  assert.match(browser, /health\.phien_ban !== "v3\.10\.0"/);
  assert.match(health, /phien_ban: "v3\.12\.0"/);
});
