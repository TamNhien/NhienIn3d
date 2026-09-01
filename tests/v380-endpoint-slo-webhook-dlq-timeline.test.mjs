import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.8.0 dong bo version runtime browser CI", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  assert.equal(read("VERSION").trim(), "3.8.0");
  assert.equal(pkg.version, "3.8.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v380.mjs");
  assert.equal(existsSync("scripts/e2e-runtime-v380.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v380.mjs"), true);
  assert.match(ci, /e2e-runtime-v380\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.8\.0/);
});

test("v3.8.0 env co webhook adapter preset va khong them migration", () => {
  for (const file of [".env.example", "apps/api/.env.example", "docker-compose.yml", "docker-compose.https.yml"]) { const text = read(file); assert.match(text, /SYSTEM_ALERT_WEBHOOK_ADAPTER/); assert.match(text, /SYSTEM_SLO_ENDPOINT_INTERVAL_MINUTES/); }
  const migrations = readFileSync("MANIFEST.txt", "utf8").match(/prisma\/migrations\/[^/]+\/migration\.sql/g) || [];
  assert.ok(migrations.every(x => !x.includes("v380")));
});

test("v3.8.0 Ops UI co endpoint SLO burn timeline full-text va dead-letter replay", () => {
  const page = read("apps/web/app/quan-tri/ops/page.tsx");
  const lib = read("apps/web/lib/quan-tri.ts");
  assert.match(page, /Endpoint SLO · time-weighted/);
  assert.match(page, /Burn-rate theo thời gian/);
  assert.match(page, /Incident \+ timeline full-text/);
  assert.match(page, /Webhook delivery \+ dead-letter/);
  assert.match(lib, /layTimelineSuCoVanHanhAdmin/);
  assert.match(lib, /layWebhookDeadLetterAdmin/);
  assert.match(lib, /replayWebhookDeadLetterAdmin/);
});
