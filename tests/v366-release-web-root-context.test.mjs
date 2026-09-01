import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("v3.6.6 GitHub Release build Web dung repository root context", () => {
  const release = readFileSync(".github/workflows/release.yml", "utf8");
  const webStep = release.match(/- name: Build và push Web image[\s\S]*?(?=\n      - name:|$)/u)?.[0] || "";
  assert.match(webStep, /context:\s*\.\s*$/m);
  assert.match(webStep, /file:\s*\.\/apps\/web\/Dockerfile\s*$/m);
  assert.doesNotMatch(webStep, /context:\s*\.\/apps\/web\s*$/m);
});

test("v3.6.6 root context cung cap du file Dockerfile Web can COPY", () => {
  const dockerfile = readFileSync("apps/web/Dockerfile", "utf8");
  assert.match(dockerfile, /COPY package\.json \.npmrc \.\//);
  assert.match(dockerfile, /COPY apps\/api\/package\.json \.\/apps\/api\/package\.json/);
  assert.match(dockerfile, /COPY apps\/web\/package\.json \.\/apps\/web\/package\.json/);
  assert.match(dockerfile, /COPY apps\/web \.\/apps\/web/);
});

test("v3.6.6 CI va E2E dong bo version patch release", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  const runtime = readFileSync("scripts/e2e-runtime-v366.ps1", "utf8");
  const browser = readFileSync("scripts/e2e-browser-v366.mjs", "utf8");
  assert.equal(pkg.version, "3.6.6");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v366.mjs");
  assert.match(ci, /e2e-runtime-v366\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.6\.6/);
  assert.match(runtime, /publicHealth\.phien_ban -eq "v3\.6\.6"/);
  assert.match(runtime, /health\.phien_ban -eq "3\.6\.6"/);
  assert.match(browser, /health\.phien_ban !== "v3\.6\.6"/);
});
