import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.7.0 co Ops Dashboard rieng va export tong hop", () => {
  assert.equal(existsSync("apps/web/app/quan-tri/ops/page.tsx"), true);
  const page = read("apps/web/app/quan-tri/ops/page.tsx");
  const lib = read("apps/web/lib/quan-tri.ts");
  const ctl = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  assert.match(page, /Ops Dashboard/);
  assert.match(page, /Xuất Ops Excel/);
  assert.match(lib, /xuatOpsTongHopExcelAdmin/);
  assert.match(ctl, /he-thong\/ops\/excel/);
});

test("v3.7.0 runtime browser E2E contract duoc giu khi patch v3.9.0", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  assert.equal(pkg.version, "3.9.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v390.mjs");
  assert.match(ci, /e2e-runtime-v390\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.9\.0/);
  const historicalRuntime = read("scripts/e2e-runtime-v370.ps1");
  assert.match(historicalRuntime, /publicHealth\.phien_ban -eq "v3\.7\.0"/);
  assert.match(historicalRuntime, /health\.phien_ban -eq "3\.7\.0"/);
  assert.match(read("scripts/e2e-browser-v370.mjs"), /Ops Dashboard/);
});

test("v3.7.0 env webhook co HMAC retry backoff", () => {
  for (const file of [".env.example", "apps/api/.env.example", "docker-compose.yml", "docker-compose.https.yml"]) {
    const text = read(file);
    assert.match(text, /SYSTEM_ALERT_WEBHOOK_SECRET/);
    assert.match(text, /SYSTEM_ALERT_WEBHOOK_MAX_RETRIES/);
    assert.match(text, /SYSTEM_ALERT_WEBHOOK_BACKOFF_MS/);
  }
});
