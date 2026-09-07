import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.27.0 dong bo current source va bulk cycle count CSV XLSX", () => {
  const pkg = JSON.parse(read("package.json"));
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  assert.equal(read("VERSION").trim(), "3.27.0");
  assert.equal(pkg.version, "3.27.0");
  assert.equal(pkg.scripts.verify, "npm run verify:v327");
  assert.equal(pkg.scripts["verify:full"], "npm run verify:full:v327");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3270.mjs");
  assert.equal(existsSync("scripts/verify-v3270.ps1"), true);
  assert.equal(existsSync("scripts/e2e-runtime-v3270.ps1"), true);
  assert.match(controller, /kho\/kiem-ke\/import\/kiem-tra/);
  assert.match(controller, /kho\/kiem-ke\/excel/);
  assert.match(service, /dong_kiem_ke_tu_bang_v3270/);
  assert.match(service, /Mỗi file kiểm kê chỉ được tối đa 200 dòng/);
  assert.match(service, /inventory_cycle_count_file_import: true/);
  assert.match(service, /inventory_cycle_count_variance_excel: true/);
  assert.match(service, /atomic_apply: true/);
  assert.match(read("scripts/e2e-runtime-v3270.ps1"), /kho\/kiem-ke\/import\/kiem-tra/);
  assert.match(read("scripts/e2e-runtime-v3270.ps1"), /inventory_cycle_count_file_import/);
  assert.match(read("scripts/e2e-browser-v3270.mjs"), /Tải CSV mẫu/);
});
