import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.12.0 dong bo version runtime browser probe fleet va CI", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  assert.equal(read("VERSION").trim(), "3.18.0");
  assert.equal(pkg.version, "3.18.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3180.mjs");
  assert.equal(pkg.scripts["probe:agent"], "node scripts/probe-agent-v3180.mjs");
  assert.match(pkg.scripts["probe:fleet"], /probe-fleet-v3180\.ps1/);
  assert.match(pkg.scripts["probe:fleet:once"], /probe-fleet-v3180\.ps1 -Once/);
  assert.equal(existsSync("scripts/probe-fleet-v3140.ps1"), true);
  assert.match(ci, /e2e-runtime-v3180\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.18\.0/);
});

test("v3.12.0 managed probe fleet doi chieu keyring profile va PostgreSQL", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const env = read(".env.example");
  assert.match(service, /cau_hinh_probe_fleet_v3120/);
  assert.match(service, /suc_khoe_probe_fleet_v3120/);
  assert.match(service, /SYSTEM_SLO_AGENT_PROFILES_JSON/);
  assert.match(service, /SYSTEM_SLO_AGENT_STALE_AFTER_SECONDS/);
  assert.match(service, /SYSTEM_SLO_AGENT_OFFLINE_AFTER_SECONDS/);
  assert.match(service, /"ONLINE" as const/);
  assert.match(service, /"STALE" as const/);
  assert.match(service, /"OFFLINE" as const/);
  assert.match(service, /"MISSING" as const/);
  assert.match(service, /secret_values_exposed: false/);
  assert.match(controller, /trang_thai_ops_v3180/);
  assert.match(env, /SYSTEM_SLO_AGENT_PROFILES_JSON=/);
});

test("v3.12.0 khong them migration va giu distributed probe HMAC v3.11", () => {
  const agent = read("scripts/probe-agent-v3120.mjs");
  const migrationDirs = readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter(x => x.isDirectory());
  assert.equal(migrationDirs.length, 23);
  assert.ok(existsSync("apps/api/prisma/migrations/202609020001_v3110_distributed_probe_dlq_keyring_oncall_archive/migration.sql"));
  assert.match(agent, /createHmac\("sha256"/);
  assert.match(agent, /timeout_ms: 5000/);
  assert.match(agent, /probe \$\{item\.endpoint_id\} failed/);
});

test("v3.12.0 probe fleet managed keepalive, compact badge va khong in secret raw", () => {
  const script = read("scripts/probe-fleet-v3120.ps1");
  const page = read("apps/web/app/quan-tri/ops/page.tsx");
  const css = read("apps/web/app/quan-tri/ops/page.module.css");
  assert.match(script, /SYSTEM_SLO_AGENT_KEYS_JSON/);
  assert.match(script, /probe-agent-v3120\.mjs/);
  assert.match(script, /\[switch\]\$Once/);
  assert.match(script, /while \(\$true\)/);
  assert.match(script, /Start-Sleep -Seconds \$IntervalSeconds/);
  assert.match(script, /secret \$\(\$secret\.Length\) chars/);
  assert.match(script, /\$\{id\}: secret ngắn hơn 16 ký tự/u);
  assert.match(script, /\$\{id\}: exit code \$LASTEXITCODE/u);
  assert.doesNotMatch(script, /"\$id:/u);
  assert.doesNotMatch(script, /Write-Host[^\n]*\$secret(?!\.Length)/);
  assert.match(page, /styles\.fleetStateBadge/);
  assert.match(css, /\.fleetStateBadge\{[^}]*align-self:flex-start[^}]*align-items:center[^}]*justify-content:center[^}]*height:22px[^}]*font-size:\.62rem/u);
});
