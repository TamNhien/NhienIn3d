import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const json = p => JSON.parse(readFileSync(p, "utf8"));
const doc = p => readFileSync(p, "utf8");

test("v3.5.1 nang Playwright khoi ban bi GHSA-7mvr-c777-76hp", () => {
  const pkg = json("package.json");
  assert.equal(pkg.devDependencies?.["@playwright/test"], "1.62.1");
  const docker = doc("apps/api/Dockerfile");
  assert.match(docker, /npm audit --workspace=@nhienin3d\/api --audit-level=high/);
  assert.match(docker, /npm audit --omit=dev --workspace=@nhienin3d\/api --audit-level=high/);
});

test("v3.5.1 runtime va browser E2E chan container cu truoc khi kiem tra SLO", () => {
  assert.equal(existsSync("scripts/e2e-runtime-v351.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v351.mjs"), true);
  const runtime = doc("scripts/e2e-runtime-v351.ps1");
  const browser = doc("scripts/e2e-browser-v351.mjs");
  const ci = doc(".github/workflows/ci.yml");
  assert.match(runtime, /Preflight API version/);
  assert.match(runtime, /phien_ban -eq "v3\.5\.1"/);
  assert.match(runtime, /container cũ/u);
  assert.match(browser, /health\.phien_ban !== "v3\.5\.1"/);
  assert.match(ci, /e2e-runtime-v(?:35[1234]|36[01234567]|37[012]|380|390|3100|3101|3102|3103|3104|3105|3110|3120|3130|3140|3150|3160|3170|3180)\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v(?:3\.5\.[1234]|3\.6\.[01234567]|3\.7\.[012]|3\.8\.0|3\.9\.0|3\.10\.[012345]|3\.11\.0|3\.12\.0|3\.13\.0|3\.14\.0|3\.15\.0|3\.18\.0)/);
});
