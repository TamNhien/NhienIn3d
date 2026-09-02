import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.10.0 dong bo version runtime browser CI va migration moi", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  const runtime = read("scripts/e2e-runtime-v3100.ps1");
  assert.equal(read("VERSION").trim(), "3.11.0");
  assert.equal(pkg.version, "3.11.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3110.mjs");
  assert.equal(existsSync("scripts/e2e-runtime-v3100.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v3100.mjs"), true);
  assert.match(ci, /e2e-runtime-v3110\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.11\.0/);
  assert.match(runtime, /202609010003_v3100_ops_persistence_dlq_oncall/);
  assert.doesNotMatch(runtime, /202609010002_v3100_ops_search_metrics/);
});

test("v3.10.0 migration co persistent endpoint encrypted DLQ cache va Ops RBAC", () => {
  const migration = read("apps/api/prisma/migrations/202609010003_v3100_ops_persistence_dlq_oncall/migration.sql");
  const schema = read("apps/api/prisma/schema.prisma");
  for (const marker of ["slo_endpoint_mau", "webhook_dlq_payload", "ops_metric_cache", "ops_phan_cong"]) assert.match(migration, new RegExp(marker));
  assert.match(migration, /payload_ciphertext/);
  assert.match(migration, /auth_tag/);
  assert.match(migration, /retry_tiep_theo_luc/);
  assert.match(migration, /CHECK \(\"?vai_tro_ops\"? IN \('OPS_VIEWER','ON_CALL','SERVICE_OWNER'\)\)/);
  for (const model of ["SloEndpointMau", "WebhookDlqPayload", "OpsMetricCache", "OpsPhanCong"]) assert.match(schema, new RegExp(`model ${model} \\{`));
});

test("v3.10.0 env wiring co probe agent DLQ scheduler encryption cache retention", () => {
  const markers = [
    "SYSTEM_SLO_PROBE_AGENT_ID", "SYSTEM_SLO_PROBE_REGION", "SYSTEM_SLO_PROBE_NODE",
    "SYSTEM_ALERT_WEBHOOK_DLQ_ENCRYPTION_KEY", "SYSTEM_ALERT_WEBHOOK_DLQ_RETRY_INTERVAL_MINUTES",
    "SYSTEM_ALERT_WEBHOOK_DLQ_SCHEDULED_MAX_ATTEMPTS", "SYSTEM_OPS_METRICS_REFRESH_MINUTES",
    "SYSTEM_OPS_HISTORY_RETENTION_DAYS"
  ];
  for (const file of [".env.example", "apps/api/.env.example", "docker-compose.yml", "docker-compose.https.yml"]) {
    const text = read(file);
    for (const marker of markers) assert.match(text, new RegExp(marker), `${file}: ${marker}`);
  }
});

test("v3.10.0 runtime E2E khoa persistent Apdex encrypted DLQ cache va RBAC", () => {
  const runtime = read("scripts/e2e-runtime-v3100.ps1");
  assert.match(runtime, /he-thong\/ops\/runtime/);
  assert.match(runtime, /he-thong\/ops\/phan-cong/);
  assert.match(runtime, /latency\.apdex/);
  assert.match(runtime, /persistent_samples/);
  assert.match(runtime, /probe_agents/);
  assert.match(runtime, /payload_encryption_ready/);
  assert.match(runtime, /ops_metrics\.refresh_phut/);
  assert.match(runtime, /rbac\.roles/);
});

test("v3.10.0 giu Release Web repository root Docker context", () => {
  const release = read(".github/workflows/release.yml");
  assert.match(release, /Build và push Web image[\s\S]*context: \.[\s\S]*file: \.\/apps\/web\/Dockerfile/u);
  assert.doesNotMatch(release, /Build và push Web image[\s\S]*context: \.\/apps\/web/u);
});
