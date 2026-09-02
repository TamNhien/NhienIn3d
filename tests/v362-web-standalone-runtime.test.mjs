import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("v3.6.2 Docker Web chay dung server.js nested cua Next standalone trong monorepo", () => {
  const docker = readFileSync("apps/web/Dockerfile", "utf8");
  assert.match(docker, /COPY --from=build --chown=node:node \/app\/apps\/web\/\.next\/standalone \.\//);
  assert.match(docker, /COPY --from=build --chown=node:node \/app\/apps\/web\/\.next\/static \.\/apps\/web\/\.next\/static/);
  assert.match(docker, /COPY --from=build --chown=node:node \/app\/apps\/web\/public \.\/apps\/web\/public/);
  assert.match(docker, /RUN test -f \/app\/apps\/web\/server\.js/);
  assert.match(docker, /WORKDIR \/app\/apps\/web[\s\S]*server\.js/);
  assert.doesNotMatch(docker, /COPY --from=build --chown=node:node \/app\/apps\/web\/\.next\/static \.\/\.next\/static/);
});

test("v3.6.2 Compose healthcheck Web va HTTPS chi phu thuoc Web healthy", () => {
  const compose = readFileSync("docker-compose.yml", "utf8");
  assert.match(compose, /web:[\s\S]*healthcheck:[\s\S]*fetch\('http:\/\/127\.0\.0\.1:3000\/'\)/);
  assert.match(compose, /https:[\s\S]*depends_on:[\s\S]*web:[\s\S]*condition: service_healthy/);
});

test("v3.6.2 E2E va CI dung phien ban patch moi", () => {
  const root = JSON.parse(readFileSync("package.json", "utf8"));
  const runtime = readFileSync("scripts/e2e-runtime-v362.ps1", "utf8");
  const browser = readFileSync("scripts/e2e-browser-v362.mjs", "utf8");
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  assert.match(root.scripts["e2e:browser"], /^node scripts\/e2e-browser-v(?:36[234567]|37[012]|380|390|3100|3101|3102|3103|3104|3105|3110|3120|3130|3140|3150)\.mjs$/);
  assert.match(runtime, /không phải v3\.6\.2/);
  assert.match(browser, /không phải v3\.6\.2/);
  assert.match(ci, /e2e-runtime-v(?:36[234567]|37[012]|380|390|3100|3101|3102|3103|3104|3105|3110|3120|3130|3140|3150)\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v(?:3\.6\.[234567]|3\.7\.[012]|3\.8\.0|3\.9\.0|3\.10\.[012345]|3\.11\.0|3\.12\.0|3\.13\.0|3\.14\.0|3\.15\.0)/);
});
