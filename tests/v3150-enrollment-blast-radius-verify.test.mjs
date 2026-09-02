import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
const read = (p) => readFileSync(p, "utf8");

test("v3.15.0 contract duoc giu khi nang v3.16.0 va current scripts dong bo", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(read("VERSION").trim(), "3.16.0");
  assert.equal(pkg.version, "3.16.0");
  assert.equal(JSON.parse(read("apps/api/package.json")).version, "3.16.0");
  assert.equal(JSON.parse(read("apps/web/package.json")).version, "3.16.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3160.mjs");
  assert.equal(pkg.scripts["probe:agent"], "node scripts/probe-agent-v3160.mjs");
  assert.match(pkg.scripts["probe:fleet"], /probe-fleet-v3160\.ps1/);
  assert.match(pkg.scripts["verify:v316"], /verify-v3160\.ps1/);
  assert.match(pkg.scripts["verify:full:v316"], /verify-v3160\.ps1 -Full/);
  assert.equal(pkg.scripts.verify, "npm run verify:v316");
  assert.equal(pkg.scripts["verify:full"], "npm run verify:full:v316");
  assert.equal(existsSync("scripts/e2e-runtime-v3150.ps1"), true);
  assert.equal(existsSync("scripts/probe-enroll-v3150.mjs"), true);
  assert.equal(existsSync("scripts/probe-enrollment-token-v3160.ps1"), true);
  assert.match(read(".github/workflows/ci.yml"), /e2e-runtime-v3160\.ps1/);
});

test("v3.15.0 probe self enrollment dung one-time token va khong lo private key", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const publicController = read("apps/api/src/quan-tri/probe-agent.controller.ts");
  const adminController = read("apps/api/src/quan-tri/quan-tri.controller.ts");
  const env = read(".env.example");
  const compose = read("docker-compose.yml");
  const enrollAgent = read("scripts/probe-enroll-v3150.mjs");
  assert.match(service, /cau_hinh_probe_enrollment_v3150/);
  assert.match(service, /nh3d-enroll-v1/);
  assert.match(service, /enroll-\$\{claims\.jti\}/);
  assert.match(service, /enrollment_v3150/);
  assert.match(service, /ED25519-ENROLLED-v3150/);
  assert.match(publicController, /@Post\("enroll"\)/);
  assert.match(adminController, /@Post\("he-thong\/ops\/probe-enrollment-token"\)/);
  assert.match(env, /SYSTEM_SLO_ENROLLMENT_SECRET=/);
  assert.match(env, /SYSTEM_SLO_ENROLLMENT_TTL_MINUTES=30/);
  assert.match(compose, /SYSTEM_SLO_ENROLLMENT_SECRET/);
  assert.match(enrollAgent, /\/probe-agent\/enroll/);
  assert.doesNotMatch(enrollAgent, /console\.log\(token\)/);
  assert.doesNotMatch(enrollAgent, /console\.log\([^\n]*process\.env\.NH3D_PROBE_ENROLLMENT_TOKEN/);
  assert.doesNotMatch(enrollAgent, /console\.log\([^\n]*PRIVATE_KEY/);
  assert.doesNotMatch(env, /BEGIN PRIVATE KEY/);
});

test("v3.15.0 service dependency blast radius va enrolled region tham gia quorum", () => {
  const service = read("apps/api/src/quan-tri/quan-tri.service.ts");
  const env = read(".env.example");
  const compose = read("docker-compose.yml");
  const page = read("apps/web/app/quan-tri/ops/page.tsx");
  const lib = read("apps/web/lib/quan-tri.ts");
  assert.match(service, /cau_hinh_service_dependency_v3150/);
  assert.match(service, /phan_tich_blast_radius_v3150/);
  assert.match(service, /impacted_services/);
  assert.match(service, /blast_radius/);
  assert.match(service, /registeredAgents/);
  assert.match(service, /enrolledRegions/);
  assert.match(env, /SYSTEM_OPS_SERVICE_DEPENDENCIES_JSON=/);
  assert.match(env, /SYSTEM_SLO_ENDPOINT_SERVICE_MAP_JSON=/);
  assert.match(compose, /SYSTEM_OPS_SERVICE_DEPENDENCIES_JSON/);
  assert.match(page, /Service dependency · blast radius/);
  assert.match(lib, /OpsServiceDependency/);
});

test("v3.15.0 verify gom local full va giu 23 migration", () => {
  const verify = read("scripts/verify-v3150.ps1");
  assert.match(verify, /npm install/);
  assert.match(verify, /security:mysql2/);
  assert.match(verify, /npm audit/);
  assert.match(verify, /npm test/);
  assert.match(verify, /npm run typecheck/);
  assert.match(verify, /npm run build/);
  assert.match(verify, /backup-db\.ps1/);
  assert.match(verify, /docker compose build --no-cache migrate api web/);
  assert.match(verify, /e2e-runtime-v3150\.ps1/);
  assert.match(verify, /npx playwright install chromium/);
  assert.match(verify, /npm run e2e:browser/);
  assert.equal(readdirSync("apps/api/prisma/migrations", { withFileTypes: true }).filter(x => x.isDirectory()).length, 23);
});


test("v3.15.0 verify full co SHA256 .NET fallback khi Get-FileHash khong ton tai", () => {
  for (const file of [
    "scripts/backup-db.ps1",
    "scripts/backup-verify.ps1",
    "scripts/e2e-runtime-v320.ps1",
  ]) {
    const src = read(file);
    assert.match(src, /Get-Command Get-FileHash -ErrorAction SilentlyContinue/);
    assert.match(src, /System\.Security\.Cryptography\.SHA256/);
    assert.match(src, /System\.BitConverter/);
  }
});


test("v3.15.0 runtime backup restore dung host dump va verify sentinel ben vung", () => {
  const runtime = read("scripts/e2e-runtime-v320.ps1");
  assert.match(runtime, /docker cp \$localDump "nhienin3d-postgres:\$remoteDump"/);
  assert.match(runtime, /--exit-on-error --single-transaction/);
  assert.match(runtime, /\$sentinelSql = "SELECT value FROM e2e_probe WHERE id = 1;"/);
  assert.match(runtime, /\$sentinelSql \| docker compose exec -T postgres sh -lc/);
  assert.doesNotMatch(runtime, /-c "SELECT CASE WHEN EXISTS/);
  assert.match(runtime, /\$sentinel -ne "nhienin3d-v320"/);
  assert.match(runtime, /verify=\$sentinel/);
});

test("v3.15.0 runtime sentinel query dung stdin de tranh mat quote tren Windows PowerShell", () => {
  const runtime = read("scripts/e2e-runtime-v320.ps1");
  assert.match(runtime, /Gửi query bằng stdin giống bước seed/);
  assert.match(runtime, /psql -U "\$POSTGRES_USER" -d "\{0\}" -X -qAt -v ON_ERROR_STOP=1/);
});

test("v3.15.0 runtime Admin auth dung CookieContainer loopback thay Cookie header tren Windows PowerShell", () => {
  const runtime = read("scripts/e2e-runtime-v3150.ps1");
  assert.match(runtime, /New-Object Microsoft\.PowerShell\.Commands\.WebRequestSession/);
  assert.match(runtime, /\$adminSession\.Cookies\.SetCookies\(\$loopbackUri, "nhienin3d_phien=/);
  assert.match(runtime, /GetCookies\(\$loopbackUri\)\["nhienin3d_phien"\]/);
  assert.match(runtime, /quan-tri\/don-hang" -Method Get -WebSession \$adminSession/);
  assert.doesNotMatch(runtime, /\$adminHeaders = @\{ Cookie =/);
  assert.doesNotMatch(runtime, /-Headers \$adminHeaders/);
});
