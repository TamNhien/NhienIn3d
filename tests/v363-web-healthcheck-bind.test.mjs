import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("v3.6.3 Next standalone bind 0.0.0.0 de healthcheck loopback khong bi unhealthy gia", () => {
  const docker = readFileSync("apps/web/Dockerfile", "utf8");
  const compose = readFileSync("docker-compose.yml", "utf8");
  assert.match(docker, /WORKDIR \/app\/apps\/web/);
  assert.match(docker, /CMD \["sh", "-c", "HOSTNAME=0\.0\.0\.0 PORT=3000 exec node server\.js"\]/);
  assert.match(compose, /fetch\('http:\/\/127\.0\.0\.1:3000\/'\)/);
  assert.match(compose, /https:[\s\S]*web:[\s\S]*condition: service_healthy/);
});

test("v3.6.3 healthcheck fix duoc giu khi nang patch tiep theo", () => {
  const root = JSON.parse(readFileSync("package.json", "utf8"));
  const api = JSON.parse(readFileSync("apps/api/package.json", "utf8"));
  const web = JSON.parse(readFileSync("apps/web/package.json", "utf8"));
  const runtime = readFileSync("scripts/e2e-runtime-v363.ps1", "utf8");
  const browser = readFileSync("scripts/e2e-browser-v363.mjs", "utf8");
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  assert.match(root.version, /^(?:3\.6\.[34567]|3\.7\.[012]|3\.8\.0|3\.9\.0|3\.10\.[012345]|3\.11\.0|3\.12\.0|3\.13\.0|3\.14\.0)$/);
  assert.equal(api.version, root.version);
  assert.equal(web.version, root.version);
  assert.match(root.scripts["e2e:browser"], /^node scripts\/e2e-browser-v(?:36[34567]|37[012]|380|390|3100|3101|3102|3103|3104|3105|3110|3120|3130|3140)\.mjs$/);
  assert.match(runtime, /không phải v3\.6\.3/);
  assert.match(runtime, /health\.phien_ban -eq "3\.6\.3"/);
  assert.match(browser, /không phải v3\.6\.3/);
  assert.match(ci, /e2e-runtime-v(?:36[34567]|37[012]|380|390|3100|3101|3102|3103|3104|3105|3110|3120|3130|3140)\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v(?:3\.6\.[34567]|3\.7\.[012]|3\.8\.0|3\.9\.0|3\.10\.[012345]|3\.11\.0|3\.12\.0|3\.13\.0|3\.14\.0)/);
});
