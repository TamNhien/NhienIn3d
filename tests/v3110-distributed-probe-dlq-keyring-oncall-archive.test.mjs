import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.11.0 dong bo version Runtime Browser CI va migration", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  assert.equal(read("VERSION").trim(), "3.19.0");
  assert.equal(pkg.version, "3.19.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3190.mjs");
  assert.equal(pkg.scripts["probe:agent"], "node scripts/probe-agent-v3190.mjs");
  assert.match(ci, /e2e-runtime-v3190\.ps1/);
  assert.ok(existsSync("scripts/e2e-runtime-v3110.ps1"));
  assert.ok(existsSync("scripts/e2e-browser-v3110.mjs"));
  assert.ok(existsSync("apps/api/prisma/migrations/202609020001_v3110_distributed_probe_dlq_keyring_oncall_archive/migration.sql"));
  assert.equal(readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter(x => x.isDirectory()).length, 23);
});

test("v3.11.0 distributed probe dung HMAC timestamp nonce va co standalone agent", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/probe-agent.controller.ts");
  const agent = read("scripts/probe-agent-v3110.mjs");
  assert.match(service, /createHmac\("sha256"/);
  assert.match(service, /sloProbeNonce\.create/);
  assert.match(service, /sort\(\(\[a\], \[b\]\) => a < b \? -1 : a > b \? 1 : 0\)/);
  assert.match(agent, /sort\(\(\[a\], \[b\]\) => a < b \? -1 : a > b \? 1 : 0\)/);
  assert.match(controller, /@Post\("heartbeat"\)/);
  assert.match(controller, /@Post\("ingest"\)/);
  assert.match(controller, /@Req\(\) request: FastifyRequest/);
  assert.match(controller, /signedBody = request\.body as Record<string, unknown>/);
  assert.match(service, /signedBody \?\? \(dto as unknown as Record<string, unknown>\)/);
  assert.match(agent, /x-nhienin3d-signature/);
  assert.match(agent, /NH3D_PROBE_AGENT_SECRET/);
  assert.match(agent, /timeout_ms: 5000/);
  assert.match(agent, /const timeoutMs = Math\.max\(100, Number\(item\.timeout_ms \|\| 5000\)\)/);
  assert.match(agent, /probe \$\{item\.endpoint_id\} failed/);
});

test("v3.11.0 DLQ keyring retry budget va async replay job", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const env = read(".env.example");
  assert.match(service, /SYSTEM_ALERT_WEBHOOK_DLQ_KEYRING_JSON/);
  assert.match(service, /webhookRetryBudget/);
  assert.match(service, /webhookReplayJob/);
  assert.match(service, /"ly_do" in result/);
  assert.match(service, /replayFailureReason/);
  assert.match(service, /rotate_dlq_key_v3110/);
  assert.ok(service.includes("const active = requested ? (keys.get(requested) || null) :"));
  assert.match(env, /SYSTEM_ALERT_WEBHOOK_DLQ_DESTINATION_MAX_ATTEMPTS=30/);
  assert.match(env, /SYSTEM_ALERT_WEBHOOK_DLQ_ACTIVE_KEY_ID=/);
});

test("v3.11.0 archive verify-before-prune khoa direct prune mac dinh", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const env = read(".env.example");
  const migration = read("apps/api/prisma/migrations/202609020001_v3110_distributed_probe_dlq_keyring_oncall_archive/migration.sql");
  assert.match(service, /mode: "ARCHIVE_REQUIRED"/);
  assert.match(service, /SYSTEM_OPS_DIRECT_PRUNE_ENABLED/);
  assert.match(service, /archive_ops_v3110/);
  assert.match(service, /source_sha=\$\{preview\.sha256\} archive_sha=\$\{archiveSha\}/);
  assert.match(migration, /PARTITION BY RANGE \("archive_month"\)/);
  assert.match(env, /SYSTEM_OPS_DIRECT_PRUNE_ENABLED=false/);
});

test("v3.11.0 on-call rotation escalation routing va incident owner", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const schema = read("apps/api/prisma/schema.prisma");
  assert.match(service, /on_call_hien_tai_v3110/);
  assert.match(service, /eligiblePolicies/);
  assert.match(service, /gan_chu_so_huu_su_co_v3110/);
  assert.match(schema, /model OpsOnCallSchedule/);
  assert.match(schema, /model OpsEscalationPolicy/);
  assert.match(schema, /chu_so_huu_id/);
});
