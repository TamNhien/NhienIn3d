import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.9.0 dong bo runtime browser CI va version", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  assert.equal(read("VERSION").trim(), "3.9.0");
  assert.equal(pkg.version, "3.9.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v390.mjs");
  assert.equal(existsSync("scripts/e2e-runtime-v390.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v390.mjs"), true);
  assert.match(ci, /e2e-runtime-v390\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.9\.0/);
});

test("v3.9.0 co migration GIN search vector va materialized incident metrics", () => {
  const migration = read("apps/api/prisma/migrations/202609010002_v390_ops_search_metrics/migration.sql");
  assert.match(migration, /search_vector/);
  assert.match(migration, /USING GIN/);
  assert.match(migration, /ops_incident_metrics_v390/);
  assert.match(migration, /percentile_cont\(0\.95\)/);
});

test("v3.9.0 env co DLQ retention replay policy va probe bearer", () => {
  for (const file of [".env.example", "apps/api/.env.example", "docker-compose.yml", "docker-compose.https.yml"]) {
    const text = read(file);
    assert.match(text, /SYSTEM_ALERT_WEBHOOK_DLQ_RETENTION_DAYS/);
    assert.match(text, /SYSTEM_ALERT_WEBHOOK_REPLAY_ALLOW_DUPLICATE/);
    assert.match(text, /SYSTEM_SLO_PROBE_BEARER_TOKEN/);
  }
});

test("v3.9.0 giu GitHub Release Web root Docker context", () => {
  const release = read(".github/workflows/release.yml");
  assert.match(release, /Build và push Web image[\s\S]*context: \.[\s\S]*file: \.\/apps\/web\/Dockerfile/u);
  assert.doesNotMatch(release, /Build và push Web image[\s\S]*context: \.\/apps\/web/u);
});
