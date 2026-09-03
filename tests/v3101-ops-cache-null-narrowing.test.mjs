import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = p => readFileSync(p, "utf8");

test("v3.11.0 Ops metrics cache narrow null truoc refreshed_at", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  assert.match(service, /if \(cache && c\) incident_metrics = \{[^\n]*refreshed_at: cache\.refreshed_at\.toISOString\(\)/);
  assert.doesNotMatch(service, /if \(c\) incident_metrics = \{[^\n]*refreshed_at: cache\.refreshed_at/);
});

test("v3.11.0 dong bo Runtime Browser CI va health", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  const health = read("apps/api/src/suc-khoe/suc-khoe.controller.ts");
  const main = read("apps/api/src/main.ts");
  const runtime = read("scripts/e2e-runtime-v3110.ps1");
  assert.equal(read("VERSION").trim(), "3.18.0");
  assert.equal(pkg.version, "3.18.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3180.mjs");
  assert.equal(existsSync("scripts/e2e-runtime-v3110.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v3110.mjs"), true);
  assert.match(ci, /e2e-runtime-v3180\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.18\.0/);
  assert.match(health, /phien_ban: "v3\.18\.0"/);
  assert.match(main, /setVersion\("3\.18\.0"\)/);
  assert.match(runtime, /202609020001_v3110_distributed_probe_dlq_keyring_oncall_archive/);
});
