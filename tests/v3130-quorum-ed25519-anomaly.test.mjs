import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.13.0 dong bo version runtime browser CI va probe tools", () => {
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
  assert.match(read(".github/workflows/ci.yml"), /Browser E2E Admin HTTPS v3\.14\.0/);
});

test("v3.13.0 probe ho tro Ed25519 va giu HMAC nonce anti-replay", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const controller = read("apps/api/src/quan-tri/probe-agent.controller.ts");
  const agent = read("scripts/probe-agent-v3140.mjs");
  const keygen = read("scripts/probe-keygen-v3140.mjs");
  const env = read(".env.example");
  assert.match(service, /SYSTEM_SLO_AGENT_PUBLIC_KEYS_JSON/);
  assert.match(service, /verifySignature\(null/);
  assert.match(service, /ED25519-v3140/);
  assert.match(service, /createHmac\("sha256"/);
  assert.match(service, /sloProbeNonce\.create/);
  assert.match(controller, /x-nhienin3d-signature-alg/);
  assert.match(agent, /signPayload\(null/);
  assert.match(agent, /"x-nhienin3d-signature-alg": "ED25519"/);
  assert.match(agent, /createHmac\("sha256"/);
  assert.match(keygen, /generateKeyPairSync\("ed25519"/);
  assert.match(env, /SYSTEM_SLO_AGENT_PUBLIC_KEYS_JSON=/);
  assert.match(env, /NH3D_PROBE_AGENT_PRIVATE_KEY_FILE=/);
});

test("v3.13.0 multi-region quorum va anomaly detection co config runtime", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const env = read(".env.example");
  assert.match(service, /cau_hinh_quorum_v3130/);
  assert.match(service, /phan_tich_quorum_v3130/);
  assert.match(service, /SYSTEM_SLO_QUORUM_MIN_REGIONS/);
  assert.match(service, /SYSTEM_SLO_QUORUM_HEALTHY_PERCENT/);
  assert.match(service, /SYSTEM_SLO_ANOMALY_LATENCY_MULTIPLIER/);
  assert.match(service, /quorum_required/);
  assert.match(service, /latency_anomaly/);
  assert.match(service, /status_anomaly/);
  assert.match(service, /trang_thai_ops_v3140/);
  assert.match(env, /SYSTEM_SLO_QUORUM_WINDOW_SECONDS=900/);
  assert.match(env, /SYSTEM_SLO_ANOMALY_LOOKBACK_MINUTES=60/);
});

test("v3.13.0 giu 23 migration va khong ghi private key vao repo", () => {
  const migrationDirs = readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter(x => x.isDirectory());
  assert.equal(migrationDirs.length, 23);
  assert.match(read(".gitignore"), /\.probe-keys\//);
  assert.doesNotMatch(read(".env.example"), /BEGIN PRIVATE KEY/);
});
