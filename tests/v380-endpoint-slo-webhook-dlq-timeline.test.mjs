import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.8.0 runtime browser scripts duoc giu lam regression lich su", () => {
  assert.equal(existsSync("scripts/e2e-runtime-v380.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v380.mjs"), true);
  const runtime = read("scripts/e2e-runtime-v380.ps1");
  const browser = read("scripts/e2e-browser-v380.mjs");
  assert.match(runtime, /v3\.8\.0/);
  assert.match(browser, /v3\.8\.0/);
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
  assert.match(page, /Incident \+ timeline/);
  assert.match(page, /Webhook (?:delivery \+|encrypted DLQ \+)/);
  assert.match(lib, /layTimelineSuCoVanHanhAdmin/);
  assert.match(lib, /layWebhookDeadLetterAdmin/);
  assert.match(lib, /replayWebhookDeadLetterAdmin/);
});
