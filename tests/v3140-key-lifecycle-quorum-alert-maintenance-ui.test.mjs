import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
const read = (p) => readFileSync(p, "utf8");

test("v3.14.0 dong bo version runtime browser CI va probe tools", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(read("VERSION").trim(), "3.14.0");
  assert.equal(pkg.version, "3.14.0");
  assert.equal(JSON.parse(read("apps/api/package.json")).version, "3.14.0");
  assert.equal(JSON.parse(read("apps/web/package.json")).version, "3.14.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3140.mjs");
  assert.equal(pkg.scripts["probe:agent"], "node scripts/probe-agent-v3140.mjs");
  assert.equal(pkg.scripts["probe:keygen"], "node scripts/probe-keygen-v3140.mjs");
  assert.match(pkg.scripts["probe:fleet"], /probe-fleet-v3140\.ps1/);
  assert.equal(existsSync("scripts/e2e-runtime-v3140.ps1"), true);
  assert.match(read(".github/workflows/ci.yml"), /e2e-runtime-v3140\.ps1/);
});

test("v3.14.0 Ed25519 key lifecycle revoke expiry va metadata an toan", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const env = read(".env.example");
  const compose = read("docker-compose.yml");
  assert.match(service, /cau_hinh_probe_agent_public_keys_v3140/);
  assert.match(service, /not_before/);
  assert.match(service, /expires_at/);
  assert.match(service, /revoked/);
  assert.match(service, /ED25519_NO_ACTIVE_KEY/);
  assert.match(service, /ED25519_KEY_EXPIRES_SOON/);
  assert.match(service, /ED25519_REVOKED_KEY_PRESENT/);
  assert.match(service, /ED25519-v3140/);
  assert.match(env, /SYSTEM_SLO_AGENT_KEY_EXPIRY_WARN_DAYS=14/);
  assert.match(compose, /SYSTEM_SLO_AGENT_PUBLIC_KEYS_JSON/);
  assert.match(compose, /SYSTEM_SLO_AGENT_KEY_EXPIRY_WARN_DAYS/);
  assert.doesNotMatch(env, /BEGIN PRIVATE KEY/);
});

test("v3.14.0 quorum alert vao pipeline escalation va Docker wiring day du", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const compose = read("docker-compose.yml");
  assert.match(service, /SYSTEM_SLO_QUORUM_ALERT_ENABLED/);
  assert.match(service, /canh_bao_quorum/);
  assert.match(service, /SLO quorum:/);
  assert.match(service, /quorum_alerting/);
  assert.match(compose, /SYSTEM_SLO_QUORUM_WINDOW_SECONDS/);
  assert.match(compose, /SYSTEM_SLO_QUORUM_MIN_REGIONS/);
  assert.match(compose, /SYSTEM_SLO_ANOMALY_LATENCY_MULTIPLIER/);
  assert.match(compose, /SYSTEM_SLO_QUORUM_ALERT_ENABLED/);
});

test("v3.14.0 Maintenance Thêm window dark compact va giu 23 migration", () => {
  const page = read("apps/web/app/quan-tri/ops/page.tsx");
  const css = read("apps/web/app/quan-tri/ops/page.module.css");
  assert.match(page, /className=\{styles\.maintenanceAddButton\}/);
  assert.match(page, />Thêm window<\/button>/);
  assert.match(css, /\.maintenanceAddButton\{/);
  assert.match(css, /background:#172137!important/);
  assert.match(css, /color:#e7edf9!important/);
  assert.equal(readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter(x => x.isDirectory()).length, 23);
});
